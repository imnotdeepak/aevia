'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, Flame, Pencil, Plus, SlidersHorizontal, Snowflake, Star, TrendingUp, X } from 'lucide-react';

import type { HabitInput } from '@/app/app/actions';
import { createTasks } from '@/app/app/task-actions';
import { useHabits, useTasks, useUserName } from '@/components/app-data';
import { ProgressRing } from '@/components/dashboard-visuals';
import { HabitDialog } from '@/components/habits/habit-dialog';
import { useHabitActions } from '@/components/habits/use-habit-actions';
import { useToday } from '@/components/habits/use-habits';
import { useTaskActions } from '@/components/tasks/use-task-actions';
import {
  ALL_DAYS,
  ACCENT_COLOR,
  habitColor,
  habitInk,
  MAX_FREEZES,
  TIMES_OF_DAY,
  STRONG_WEEK_PERCENT,
  WEEKDAY_NAMES,
  addDays,
  bestStreak,
  consistency,
  currentStreak,
  dayProgress,
  formatStreak,
  freezeTokens,
  fromDateKey,
  habitState,
  isWeekly,
  streakInDays,
  weekCount,
  type HabitData,
  type HabitState,
} from '@/lib/habit-utils';

const SUGGESTIONS = ['Drink water', 'Exercise', 'Read 10 pages', 'Meditate', 'Journal', 'Plan tomorrow'];

function greeting(hour: number) {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function TodayView() {
  const name = useUserName();
  const today = useToday();
  const { habits, error: habitError, clearError: clearHabitError, create, update } = useHabits();
  const { tick, removeHabit, freezeDay } = useHabitActions();
  const { toggleTask, removeTask } = useTaskActions();
  const { items: tasks, error: taskError, clearError: clearTaskError, run } = useTasks();
  const [picked, setPicked] = useState<string | null>(null);
  const [habitDraft, setHabitDraft] = useState('');
  const [taskDraft, setTaskDraft] = useState('');
  const [showDone, setShowDone] = useState(false);
  // The day the "missed yesterday" prompt was dismissed for, remembered across reloads.
  const [missedDismissed, setMissedDismissed] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aevia-missed-dismissed');
    } catch {
      return null;
    }
  });
  const [dialog, setDialog] = useState<{ habit?: HabitData } | null>(null);

  const tokens = useMemo(() => (today ? freezeTokens(habits, today) : null), [habits, today]);

  if (!today || !tokens) return <TodaySkeleton />;

  const selected = picked && picked <= today ? picked : today;
  const isToday = selected === today;
  const when = isToday ? 'today' : 'that day';

  const stateOf = (habit: HabitData) => habitState(habit, selected);
  const todo = habits.filter((habit) => stateOf(habit) === 'todo');
  const finished = habits.filter((habit) => ['done', 'frozen'].includes(stateOf(habit)));
  const resting = habits.filter((habit) => stateOf(habit) === 'resting');
  // Frozen days are protected, so they count neither for nor against today's progress.
  const doneCount = finished.filter((habit) => stateOf(habit) === 'done').length;
  const counted = todo.length + doneCount;
  const percentage = counted ? Math.round((doneCount / counted) * 100) : 0;
  const scheduled = [...todo, ...finished];
  const canFreeze = selected < today && tokens.available > 0;

  // To-do habits grouped by part of the day. Headings only show when they help.
  const groups = [
    ...TIMES_OF_DAY.map((time) => ({ id: time.id as string, label: time.label, items: todo.filter((habit) => habit.timeOfDay === time.id) })),
    { id: 'anytime', label: 'Anytime', items: todo.filter((habit) => !habit.timeOfDay) },
  ].filter((group) => group.items.length > 0);
  const showHeadings = groups.length > 1 || (groups.length === 1 && groups[0].id !== 'anytime');

  // Habits that were due yesterday and never got ticked. Weekly habits are left out: any day can count.
  const yesterday = addDays(today, -1);
  const missed = isToday && missedDismissed !== today
    ? habits.filter((habit) => !isWeekly(habit) && yesterday >= habit.since && habitState(habit, yesterday) === 'todo')
    : [];
  const dismissMissed = () => {
    setMissedDismissed(today);
    try {
      localStorage.setItem('aevia-missed-dismissed', today);
    } catch {
      // Private browsing: the prompt just comes back after a reload.
    }
  };

  const dayTasks = tasks.filter((item) => item.date === selected);
  const openTasks = dayTasks.filter((item) => !item.done);
  const doneTasks = dayTasks.filter((item) => item.done);

  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const weekConsistency = consistency(habits, week[0], today);
  const byLength = (a: { habit: HabitData; streak: number }, b: { habit: HabitData; streak: number }) => streakInDays(b.habit, b.streak) - streakInDays(a.habit, a.streak);
  const topStreak = habits.map((habit) => ({ habit, streak: currentStreak(habit, today) })).sort(byLength)[0];
  const bestEver = habits.map((habit) => ({ habit, streak: bestStreak(habit) })).sort(byLength)[0];

  const selectedDate = fromDateKey(selected);
  const dateLabel = selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const left = todo.length + openTasks.length;

  const addHabit = () => {
    const value = habitDraft.trim();
    if (!value) return;
    create({ name: value, color: ACCENT_COLOR, days: ALL_DAYS, weeklyTarget: null, timeOfDay: null });
    setHabitDraft('');
  };

  const addTask = () => {
    const title = taskDraft.trim();
    if (!title) return;
    const entries = [{ title, date: selected }];
    run({ type: 'add', tasks: [{ id: `tmp-${crypto.randomUUID()}`, title, date: selected, done: false }] }, () => createTasks(entries));
    setTaskDraft('');
  };

  const saveHabit = (input: HabitInput) => (dialog?.habit ? update(dialog.habit.id, input) : create(input));
  const error = habitError ?? taskError;
  const dismissError = () => {
    clearHabitError();
    clearTaskError();
  };

  const summary =
    scheduled.length + dayTasks.length === 0
      ? 'Nothing planned yet'
      : left === 0
        ? 'All done. Nice work.'
        : `${plural(todo.length, 'habit')} and ${plural(openTasks.length, 'task')} left`;

  return (
    <section className="mx-auto max-w-5xl pb-8 pt-2 sm:pt-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{isToday ? 'Today' : 'Looking back'} · {dateLabel}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {isToday ? `${greeting(new Date().getHours())}, ${name.split(' ')[0]}` : `${WEEKDAY_NAMES[selectedDate.getDay()]}'s plan`}
        </h1>
        <p className={`mt-2 ${left === 0 && scheduled.length + dayTasks.length > 0 ? 'text-[var(--accent)]' : 'text-muted-foreground'}`}>{summary}</p>
      </div>

      {/* Week strip: tap a day to see or fix it */}
      <div className="mt-6">
        <div className="grid grid-cols-7 gap-2 sm:gap-3" role="group" aria-label="Last 7 days">
          {week.map((key) => {
            const value = dayProgress(habits, key);
            const active = key === selected;
            return (
              <button key={key} type="button" aria-pressed={active} onClick={() => setPicked(key)} className={`flex flex-col items-center gap-2 rounded-2xl border py-3 transition-colors ${active ? 'border-[color:var(--accent)]/50 bg-[var(--accent-soft)]' : 'border-border bg-card hover:border-[var(--border-strong)]'}`}>
                <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${active ? 'text-[var(--accent)]' : 'text-muted-foreground'}`}>{WEEKDAY_NAMES[fromDateKey(key).getDay()].slice(0, 3)}</span>
                <ProgressRing value={value ?? 0} size={36}>
                  {value === 100 ? <Check className="size-3.5 text-[var(--accent)]" strokeWidth={3} /> : <span className="text-[10px] font-semibold text-muted-foreground">{fromDateKey(key).getDate()}</span>}
                </ProgressRing>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {isToday ? 'Tap a past day to review it or fix a missed habit.' : (
            <>Editing a past day. <button type="button" onClick={() => setPicked(null)} className="text-[var(--accent)] underline-offset-4 hover:underline">Back to today</button></>
          )}
        </p>
      </div>

      {missed.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent-soft)] p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">{missed.length === 1 ? '1 habit was not done yesterday' : `${missed.length} habits were not done yesterday`}. Fix it before it breaks a streak.</p>
            <button type="button" onClick={dismissMissed} aria-label="Dismiss" className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
          <ul className="mt-3 grid gap-2">
            {missed.map((habit) => (
              <li key={habit.id} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: habitColor(habit.color) }} />
                <span className="min-w-0 flex-1 truncate text-sm">{habit.name}</span>
                <button type="button" onClick={() => tick(habit, yesterday, true)} className="h-8 rounded-full bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-foreground)]">I did it</button>
                {tokens.available > 0 && <button type="button" onClick={() => freezeDay(habit, yesterday, true)} aria-label={`Freeze ${habit.name} for yesterday`} className="flex h-8 items-center gap-1 rounded-full border border-sky-300/40 px-3 text-xs font-medium text-sky-300"><Snowflake className="size-3.5" />Freeze</button>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
          <button type="button" onClick={dismissError} className="underline">Dismiss</button>
        </p>
      )}

      {/* The checklist comes first; the summary sits beside it on wide screens and below it on phones. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid content-start gap-8">
          <div>
            <SectionHeader title="Habits" count={scheduled.length ? `${finished.length}/${scheduled.length}` : undefined} />
            <form onSubmit={(event) => { event.preventDefault(); addHabit(); }} className="mt-3 flex gap-2">
              <input value={habitDraft} onChange={(event) => setHabitDraft(event.target.value)} maxLength={60} placeholder="Add a habit and press Enter" aria-label="New habit name" className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 outline-none transition-colors focus:border-[var(--accent)]" />
              <button type="button" onClick={() => setDialog({})} aria-label="New habit with options" title="Choose days and color" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"><SlidersHorizontal className="size-5" /></button>
            </form>

            {habits.length === 0 ? (
              <div className="mt-4 rounded-[1.75rem] border border-dashed border-border-strong p-8 text-center">
                <p className="text-lg font-semibold">Start with one habit</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Pick a suggestion or type your own above. You can change the days and color of any habit later.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <button key={suggestion} type="button" onClick={() => create({ name: suggestion, color: ACCENT_COLOR, days: ALL_DAYS, weeklyTarget: null, timeOfDay: null })} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                      <Plus className="size-3.5" />{suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {scheduled.length > 0 && todo.length === 0 && (
                  <p className="mt-4 rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent-soft)] px-5 py-4 text-sm text-[var(--accent)]">All habits done {when}. Nice work.</p>
                )}
                <ul className="mt-4 grid gap-3">
                  {groups.map((group) => (
                    <Fragment key={group.id}>
                      {showHeadings && <li className="mt-1 list-none text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{group.label}</li>}
                      {group.items.map((habit) => <HabitRow key={habit.id} habit={habit} state="todo" selected={selected} today={today} onToggle={() => tick(habit, selected, true)} onEdit={() => setDialog({ habit })} onFreeze={canFreeze && !isWeekly(habit) ? () => freezeDay(habit, selected, true) : undefined} />)}
                    </Fragment>
                  ))}
                  {scheduled.length === 0 && <li className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No habits are scheduled for this day.</li>}
                </ul>
                {finished.length > 0 && (
                  <div className="mt-4">
                    <button type="button" aria-expanded={showDone} onClick={() => setShowDone((value) => !value)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      <ChevronDown className={`size-4 transition-transform ${showDone ? '' : '-rotate-90'}`} />Done ({finished.length})
                    </button>
                    {showDone && (
                      <ul className="mt-3 grid gap-3">
                        {finished.map((habit) => <HabitRow key={habit.id} habit={habit} state={stateOf(habit)} selected={selected} today={today} onToggle={() => (stateOf(habit) === 'frozen' ? freezeDay(habit, selected, false) : tick(habit, selected, false))} onEdit={() => setDialog({ habit })} />)}
                      </ul>
                    )}
                  </div>
                )}
                {resting.length > 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Resting {when}: {resting.map((habit, i) => (
                      <span key={habit.id}>{i > 0 && ', '}<button type="button" onClick={() => setDialog({ habit })} className="underline-offset-4 hover:text-foreground hover:underline">{habit.name}</button></span>
                    ))}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <SectionHeader title="Tasks" count={dayTasks.length ? `${doneTasks.length}/${dayTasks.length}` : undefined} action={<Link href="/app/tasks" className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">Plan the week<ArrowRight className="size-3.5" /></Link>} />
            <form onSubmit={(event) => { event.preventDefault(); addTask(); }} className="mt-3 flex gap-2">
              <input value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} maxLength={120} placeholder={`Add a task for ${isToday ? 'today' : WEEKDAY_NAMES[selectedDate.getDay()]}`} aria-label="New task" className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 outline-none transition-colors focus:border-[var(--accent)]" />
              <button type="submit" disabled={!taskDraft.trim()} aria-label="Add task" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors enabled:hover:border-[var(--accent)] enabled:hover:text-[var(--accent)] disabled:opacity-40"><Plus className="size-5" /></button>
            </form>
            {dayTasks.length === 0 ? (
              <p className="mt-4 rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No tasks for {when}. One-off things you need to get done go here.</p>
            ) : (
              <ul className="mt-4 grid gap-2">
                {[...openTasks, ...doneTasks].map((item) => (
                  <li key={item.id} className="group flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card pl-4 pr-2">
                    <button type="button" role="checkbox" aria-checked={item.done} aria-label={item.title} disabled={item.id.startsWith('tmp-')} onClick={() => toggleTask(item)} className={`grid size-6 shrink-0 place-items-center rounded-md border transition-colors ${item.done ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 'border-[var(--border-strong)]'}`}>{item.done && <Check className="size-4" />}</button>
                    <span className={`flex-1 py-3 break-words ${item.done ? 'text-muted-foreground line-through' : ''}`}>{item.title}</span>
                    <button type="button" aria-label={`Delete ${item.title}`} disabled={item.id.startsWith('tmp-')} onClick={() => removeTask(item)} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><X className="size-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="grid content-start gap-4 lg:sticky lg:top-6">
          <div className="rounded-[1.75rem] border border-border bg-card p-6 text-center">
            <div className="flex justify-center">
              <ProgressRing value={percentage} size={140} thickness={7}>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.03em]">{percentage}%</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Habits</p>
                </div>
              </ProgressRing>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{scheduled.length === 0 ? 'No habits scheduled' : `${finished.length} of ${scheduled.length} done ${when}`}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1">
            <Stat icon={<Snowflake className="size-4 text-sky-300" />} label="Freeze tokens" value={`${tokens.available} of ${MAX_FREEZES}`} hint={tokens.available >= MAX_FREEZES ? 'Full. Use one on a missed day.' : `A week at ${STRONG_WEEK_PERCENT}%+ earns one`} />
            <Stat icon={<Flame className="size-4 text-orange-400" />} label="Longest active streak" value={topStreak && topStreak.streak > 0 ? formatStreak(topStreak.habit, topStreak.streak) : '0 days'} hint={topStreak && topStreak.streak > 0 ? topStreak.habit.name : undefined} />
            <Stat icon={<TrendingUp className="size-4 text-[var(--accent)]" />} label="Last 7 days" value={`${weekConsistency}%`} />
            <Stat icon={<Star className="size-4 text-yellow-400" />} label="Best streak ever" value={bestEver && bestEver.streak > 0 ? formatStreak(bestEver.habit, bestEver.streak) : '0 days'} hint={bestEver && bestEver.streak > 0 ? bestEver.habit.name : undefined} />
          </div>
        </aside>
      </div>

      {dialog && (
        <HabitDialog
          key={dialog.habit?.id ?? 'new'}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          initial={dialog.habit && { name: dialog.habit.name, color: dialog.habit.color, days: dialog.habit.days, weeklyTarget: dialog.habit.weeklyTarget, timeOfDay: dialog.habit.timeOfDay }}
          onSubmit={saveHabit}
          onDelete={dialog.habit && (() => removeHabit(dialog.habit!))}
        />
      )}
    </section>
  );
}

function SectionHeader({ title, count, action }: { title: string; count?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}{count && <span className="ml-2 font-normal tracking-normal">{count}</span>}</h2>
      {action}
    </div>
  );
}

function HabitRow({ habit, state, selected, today, onToggle, onEdit, onFreeze }: { habit: HabitData; state: HabitState; selected: string; today: string; onToggle: () => void; onEdit: () => void; onFreeze?: () => void }) {
  const streak = currentStreak(habit, today);
  const done = state === 'done';
  const frozen = state === 'frozen';
  const weekly = habit.weeklyTarget;
  return (
    <li className={`flex items-center rounded-3xl border transition-colors ${done ? 'border-[color:var(--accent)]/30 bg-[var(--accent-soft)]' : frozen ? 'border-sky-300/30 bg-sky-300/10' : 'border-border bg-card hover:border-[var(--border-strong)]'}`}>
      <button type="button" aria-pressed={done} aria-label={frozen ? `${habit.name} (frozen). Unfreeze` : undefined} onClick={onToggle} className="flex min-h-[4.5rem] flex-1 items-center gap-4 rounded-3xl px-5 text-left">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 transition-all" style={{ borderColor: frozen ? 'rgb(125 211 252)' : habitColor(habit.color), background: done ? habitColor(habit.color) : 'transparent' }}>
          {done && <Check className="size-5" style={{ color: habitInk(habit.color) }} strokeWidth={3} />}
          {frozen && <Snowflake className="size-5 text-sky-300" />}
        </span>
        <span className="flex-1">
          <span className={`block font-medium ${done || frozen ? 'text-muted-foreground' : ''} ${done ? 'line-through decoration-1' : ''}`}>{habit.name}</span>
          {frozen && <span className="block text-xs text-sky-300">Frozen. Streak protected. Tap to unfreeze.</span>}
          {weekly !== null && !frozen && <span className="block text-xs text-muted-foreground">{weekCount(habit, selected)} of {weekly} this week</span>}
        </span>
        {streak > 0 && <span className="flex items-center gap-1 text-sm text-muted-foreground"><Flame className="size-4 text-orange-400" />{streak}{isWeekly(habit) ? 'w' : ''}</span>}
      </button>
      {onFreeze && (
        <button type="button" aria-label={`Freeze ${habit.name} for this day`} title="Use a freeze token to protect your streak" onClick={onFreeze} className="mr-1 grid size-9 place-items-center rounded-full text-sky-300 transition-colors hover:bg-sky-300/10">
          <Snowflake className="size-4" />
        </button>
      )}
      <button type="button" aria-label={`Edit ${habit.name}`} onClick={onEdit} className="mr-3 grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <Pencil className="size-4" />
      </button>
    </li>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TodaySkeleton() {
  return (
    <section className="mx-auto max-w-5xl pt-8" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-card" />
      <div className="mt-8 grid grid-cols-7 gap-3">{Array.from({ length: 7 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />)}</div>
      <div className="mt-6 h-72 animate-pulse rounded-[1.75rem] bg-card" />
    </section>
  );
}
