'use server';

import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getDb } from '@/lib/db';
import { habit, habitCompletion, habitFreeze, userSettings } from '@/lib/db/schema';
import {
  DATE_PATTERN,
  FREEZE_WINDOW_DAYS,
  HABIT_COLORS,
  addDays,
  freezeTokens,
  fromDateKey,
  isScheduled,
  isTimeOfDay,
  normalizeDays,
  normalizeHabitColor,
  toDateKey,
  type TimeOfDay,
} from '@/lib/habit-utils';
import { loadHabits, requireSession } from '@/lib/habits';
import { normalizeHex, type ThemeSettings } from '@/lib/theme';

export type HabitInput = { name: string; color: string; days: string; weeklyTarget: number | null; timeOfDay: TimeOfDay | null };

function clean(input: HabitInput): HabitInput {
  const name = input.name.trim().slice(0, 60);
  if (!name) throw new Error('Give the habit a name.');
  const days = normalizeDays(input.days);
  if (!days) throw new Error('Pick at least one day.');
  const color = HABIT_COLORS.includes(normalizeHabitColor(input.color)) ? normalizeHabitColor(input.color) : HABIT_COLORS[0];

  let weeklyTarget: number | null = null;
  if (input.weeklyTarget !== null && input.weeklyTarget !== undefined) {
    weeklyTarget = Math.round(Number(input.weeklyTarget));
    if (!(weeklyTarget >= 1 && weeklyTarget <= days.length)) {
      throw new Error(`Choose between 1 and ${days.length} times a week, based on the days you picked.`);
    }
  }
  const timeOfDay = isTimeOfDay(input.timeOfDay) ? input.timeOfDay : null;
  return { name, color, days, weeklyTarget, timeOfDay };
}

function refresh() {
  revalidatePath('/app', 'layout');
}

export async function createHabit(input: HabitInput, today: string) {
  const { user } = await requireSession();
  if (!DATE_PATTERN.test(today)) throw new Error('Invalid date.');
  const values = clean(input);
  await getDb()
    .insert(habit)
    .values({ id: randomUUID(), userId: user.id, ...values, startDate: today, sortOrder: Math.floor(Date.now() / 1000) });
  refresh();
}

export async function updateHabit(id: string, input: HabitInput) {
  const { user } = await requireSession();
  await getDb()
    .update(habit)
    .set(clean(input))
    .where(and(eq(habit.id, id), eq(habit.userId, user.id)));
  refresh();
}

/** Hides the habit right away. It is removed for good a day later, so the delete can be undone. */
export async function deleteHabit(id: string) {
  const { user } = await requireSession();
  await getDb()
    .update(habit)
    .set({ deletedAt: new Date() })
    .where(and(eq(habit.id, id), eq(habit.userId, user.id)));
  refresh();
}

export async function restoreHabit(id: string) {
  const { user } = await requireSession();
  await getDb()
    .update(habit)
    .set({ deletedAt: null })
    .where(and(eq(habit.id, id), eq(habit.userId, user.id)));
  refresh();
}

async function ownedHabit(userId: string, habitId: string) {
  const [owned] = await getDb()
    .select({ id: habit.id })
    .from(habit)
    .where(and(eq(habit.id, habitId), eq(habit.userId, userId)));
  if (!owned) throw new Error('Habit not found.');
}

export async function setHabitCompletion(habitId: string, date: string, done: boolean) {
  const { user } = await requireSession();
  if (!DATE_PATTERN.test(date)) throw new Error('Invalid date.');
  const db = getDb();
  await ownedHabit(user.id, habitId);

  if (done) {
    await db
      .insert(habitCompletion)
      .values({ id: randomUUID(), habitId, userId: user.id, date })
      .onConflictDoNothing();
    // Doing the habit after all gives the freeze token back.
    await db.delete(habitFreeze).where(and(eq(habitFreeze.habitId, habitId), eq(habitFreeze.date, date)));
  } else {
    await db.delete(habitCompletion).where(and(eq(habitCompletion.habitId, habitId), eq(habitCompletion.date, date)));
  }
  refresh();
}

/** Spend a freeze token to protect a missed day (frozen = true), or take the freeze back. */
export async function setHabitFreeze(habitId: string, date: string, frozen: boolean, today: string) {
  const { user } = await requireSession();
  if (!DATE_PATTERN.test(date) || !DATE_PATTERN.test(today)) throw new Error('Invalid date.');
  const db = getDb();
  await ownedHabit(user.id, habitId);

  if (!frozen) {
    await db.delete(habitFreeze).where(and(eq(habitFreeze.habitId, habitId), eq(habitFreeze.date, date)));
    refresh();
    return;
  }

  // The browser reports its own "today"; only accept it if it is close to the server's date.
  const skew = Math.abs(fromDateKey(today).getTime() - fromDateKey(toDateKey(new Date())).getTime()) / 86_400_000;
  if (skew > 2) throw new Error('Your clock looks off. Reload and try again.');
  if (date > today || date < addDays(today, -FREEZE_WINDOW_DAYS)) {
    throw new Error(`You can freeze a missed day from the last ${FREEZE_WINDOW_DAYS} days.`);
  }

  const habits = await loadHabits(user.id);
  const target = habits.find((item) => item.id === habitId);
  if (!target) throw new Error('Habit not found.');
  if (target.weeklyTarget !== null) throw new Error('Weekly habits do not need freezes. Any days of the week count.');
  if (!isScheduled(target, date)) throw new Error('That habit is not scheduled on that day.');
  if (target.completed.includes(date)) throw new Error('That day is already done.');
  if (target.frozen.includes(date)) return;

  // Replay the token balance with this freeze added; it must never go below zero.
  const proposed = habits.map((item) => (item.id === habitId ? { ...item, frozen: [...item.frozen, date] } : item));
  if (!freezeTokens(proposed, today).valid) throw new Error('No freeze tokens available. Earn one with a week at 80% or better.');

  await db.insert(habitFreeze).values({ id: randomUUID(), habitId, userId: user.id, date }).onConflictDoNothing();
  refresh();
}

export async function saveTheme(theme: ThemeSettings) {
  const { user } = await requireSession();
  const values = {
    accent: normalizeHex(theme.accent),
    background: normalizeHex(theme.background),
    foreground: normalizeHex(theme.foreground),
    updatedAt: new Date(),
  };
  await getDb()
    .insert(userSettings)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: userSettings.userId, set: values });
  refresh();
}
