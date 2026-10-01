import 'server-only';

import { and, asc, eq, gte, isNotNull, isNull, lt } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { boardCard, habit, habitCompletion, habitFreeze, task, userSettings } from '@/lib/db/schema';
import { addDays, isTimeOfDay, toDateKey, type HabitData } from '@/lib/habit-utils';
import { isBoardStatus, type BoardCardData, type TaskData } from '@/lib/planner';
import type { ThemeSettings } from '@/lib/theme';

export async function requireSession() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  return session;
}

/** The signed-in user's habits with the last year of completions. */
export async function loadHabits(userId: string): Promise<HabitData[]> {
  const db = getDb();
  // Pad by a day each way so timezone differences from the server never cut off a date.
  const since = addDays(toDateKey(new Date()), -367);

  const [habits, completions, freezes] = await Promise.all([
    db
      .select()
      .from(habit)
      .where(and(eq(habit.userId, userId), isNull(habit.deletedAt)))
      .orderBy(asc(habit.sortOrder), asc(habit.createdAt)),
    db
      .select({ habitId: habitCompletion.habitId, date: habitCompletion.date })
      .from(habitCompletion)
      .where(and(eq(habitCompletion.userId, userId), gte(habitCompletion.date, since))),
    db
      .select({ habitId: habitFreeze.habitId, date: habitFreeze.date })
      .from(habitFreeze)
      .where(and(eq(habitFreeze.userId, userId), gte(habitFreeze.date, since))),
  ]);

  const group = (rows: { habitId: string; date: string }[]) => {
    const byHabit = new Map<string, string[]>();
    for (const { habitId, date } of rows) {
      const list = byHabit.get(habitId);
      if (list) list.push(date);
      else byHabit.set(habitId, [date]);
    }
    return byHabit;
  };
  const completedBy = group(completions);
  const frozenBy = group(freezes);

  return habits.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    days: row.days,
    weeklyTarget: row.weeklyTarget,
    timeOfDay: isTimeOfDay(row.timeOfDay) ? row.timeOfDay : null,
    since: row.startDate ?? addDays(toDateKey(row.createdAt), -1),
    completed: completedBy.get(row.id) ?? [],
    frozen: frozenBy.get(row.id) ?? [],
  }));
}

/** Permanently remove habits that were deleted more than a day ago (they stay briefly so undo works). */
export async function purgeDeletedHabits(userId: string) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await getDb()
    .delete(habit)
    .where(and(eq(habit.userId, userId), isNotNull(habit.deletedAt), lt(habit.deletedAt, cutoff)));
}

/** The signed-in user's saved theme colors (null entries mean the app default). */
export async function loadTheme(userId: string): Promise<ThemeSettings> {
  const [row] = await getDb().select().from(userSettings).where(eq(userSettings.userId, userId));
  return { accent: row?.accent ?? null, background: row?.background ?? null, foreground: row?.foreground ?? null };
}

export async function loadTasks(userId: string): Promise<TaskData[]> {
  const rows = await getDb().select().from(task).where(eq(task.userId, userId)).orderBy(asc(task.createdAt));
  return rows.map(({ id, title, date, done }) => ({ id, title, date, done }));
}

export async function loadBoard(userId: string): Promise<BoardCardData[]> {
  const rows = await getDb().select().from(boardCard).where(eq(boardCard.userId, userId)).orderBy(asc(boardCard.position), asc(boardCard.createdAt));
  return rows.flatMap(({ id, title, notes, status }) => (isBoardStatus(status) ? [{ id, title, notes, status }] : []));
}
