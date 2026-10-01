'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Plus, Snowflake, Star } from 'lucide-react';

import type { HabitInput } from '@/app/app/actions';
import { HabitDialog } from '@/components/habits/habit-dialog';
import { useHabits } from '@/components/app-data';
import { useHabitActions } from '@/components/habits/use-habit-actions';
import { useToday } from '@/components/habits/use-habits';
import {
  bestStreak,
  consistency,
  currentStreak,
  dayProgress,
  habitColor,
  habitInk,
  isScheduled,
  isWeekly,
  toDateKey,
  type HabitData,
} from '@/lib/habit-utils';

const monthKey = (year: number, month: number, day: number) => toDateKey(new Date(year, month, day));

export function HabitsView() {
  const today = useToday();
  const { habits, error, clearError, create, update } = useHabits();
  const { tick, removeHabit, freezeDay } = useHabitActions();
  const [offset, setOffset] = useState(0);
  const [dialog, setDialog] = useState<{ habit?: HabitData } | null>(null);

  if (!today) return <div className="h-96 animate-pulse rounded-[1.85rem] bg-card" aria-busy="true" aria-label="Loading" />;

  const base = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + offset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const first = monthKey(year, month, 1);
  const last = monthKey(year, month, daysInMonth);
  const lastCounted = last < today ? last : today;
  const monthLabel = base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const todayScheduled = habits.filter((habit) => isScheduled(habit, today));
  const doneToday = todayScheduled.filter((habit) => habit.completed.includes(today)).length;
  const monthConsistency = first > today ? 0 : consistency(habits, first, lastCounted);

  const trend = Array.from({ length: daysInMonth }, (_, i) => {
    const key = monthKey(year, month, i + 1);
    return key > today ? null : dayProgress(habits, key);
  });
  const points = trend.map((value, i) => (value === null ? null : { x: (i / Math.max(daysInMonth - 1, 1)) * 1200, y: 82 - (value / 100) * 72 }));
  const path = points.filter((point) => point !== null).map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');

  const save = (input: HabitInput) => (dialog?.habit ? update(dialog.habit.id, input) : create(input));

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card px-6 py-6 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">{monthLabel}</p>
            <p className="mt-1 font-semibold">{todayScheduled.length === 0 ? 'No habits scheduled today' : `${doneToday}/${todayScheduled.length} habits done today`}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setOffset((value) => value - 1)} className="grid size-12 place-items-center rounded-full border border-border transition-colors hover:border-[var(--border-strong)]" aria-label="Previous month"><ChevronLeft /></button>
            <button type="button" onClick={() => setOffset(0)} disabled={offset === 0} className="h-12 rounded-full border border-border px-4 text-sm font-medium transition-colors enabled:hover:border-[var(--border-strong)] disabled:opacity-40">This month</button>
            <button type="button" onClick={() => setOffset((value) => value + 1)} disabled={offset >= 0} className="grid size-12 place-items-center rounded-full border border-border transition-colors enabled:hover:border-[var(--border-strong)] disabled:opacity-40" aria-label="Next month"><ChevronRight /></button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--surface-elevated)]"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${todayScheduled.length ? (doneToday / todayScheduled.length) * 100 : 0}%` }} /></div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Tap a day to mark it. Tap a habit name to edit it.</p>
        <button type="button" onClick={() => setDialog({})} className="flex h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-[var(--accent)] px-6 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"><Plus className="size-4" />New habit</button>
      </div>

      {error && (
        <p role="alert" className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
          <button type="button" onClick={clearError} className="underline">Dismiss</button>
        </p>
      )}

      {habits.length === 0 ? (
        <section className="rounded-[1.85rem] border border-dashed border-border-strong p-12 text-center">
          <p className="text-lg font-semibold">No habits yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Create your first habit and it will show up here and on Today.</p>
          <button type="button" onClick={() => setDialog({})} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)]"><Plus className="size-4" />Create a habit</button>
        </section>
      ) : (
        <section className="overflow-x-auto rounded-[1.85rem] border border-border bg-card">
          <div style={{ minWidth: 260 + daysInMonth * 43 + 190 }}>
            <div className="grid grid-cols-[150px_1fr_190px] sm:grid-cols-[200px_1fr_190px] border-b border-border">
              <div className="sticky left-0 z-10 flex items-center gap-3 border-r border-border bg-card px-6 text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground"><span className="size-2 rounded-full bg-[var(--accent)]" />Trend</div>
              <div className="h-24 px-5 pt-4">
                <svg viewBox="0 0 1200 90" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Daily completion trend">
                  {path ? <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /> : null}
                </svg>
              </div>
              <div className="grid place-items-center border-l border-border"><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Month</p><p className="mt-2 rounded-2xl border border-[color:var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-2 text-2xl font-semibold text-[var(--accent)]">{monthConsistency}%</p></div></div>
            </div>

            <div className="grid grid-cols-[150px_1fr_190px] sm:grid-cols-[200px_1fr_190px] border-b border-border text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">
              <div className="sticky left-0 z-10 border-r border-border bg-card px-5 py-4">Habit</div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(40px, 1fr))` }}>
                {Array.from({ length: daysInMonth }, (_, i) => <div key={i} className={`grid place-items-center border-r border-border py-4 ${monthKey(year, month, i + 1) === today ? 'text-[var(--accent)]' : ''}`}>{i + 1}</div>)}
              </div>
              <div className="border-l border-border px-5 py-4 text-right">Stats</div>
            </div>

            {habits.map((habit) => {
              const done = new Set(habit.completed);
              const frozen = new Set(habit.frozen);
              const unit = isWeekly(habit) ? 'w' : '';
              const streak = currentStreak(habit, today);
              const best = bestStreak(habit);
              const rate = first > today ? 0 : consistency([habit], first, lastCounted);
              return (
                <div key={habit.id} className="grid min-h-14 grid-cols-[150px_1fr_190px] sm:grid-cols-[200px_1fr_190px] border-b border-border last:border-b-0">
                  <button type="button" onClick={() => setDialog({ habit })} title="Edit habit" className="sticky left-0 z-10 flex items-center gap-3 border-r border-border bg-card px-5 text-left text-xs font-semibold uppercase leading-tight tracking-[.08em] transition-colors hover:bg-muted"><span className="size-2.5 shrink-0 rounded-full" style={{ background: habitColor(habit.color) }} /><span className="line-clamp-2">{habit.name}</span></button>
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(40px, 1fr))` }}>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const key = monthKey(year, month, i + 1);
                      const future = key > today;
                      const scheduled = isScheduled(habit, key);
                      const complete = done.has(key);
                      const isFrozen = frozen.has(key) && !complete;
                      return (
                        <div key={key} className={`grid place-items-center border-r border-border ${key === today ? 'bg-[var(--accent-soft)]/30' : ''}`}>
                          {isFrozen ? (
                            <button type="button" disabled={future} aria-label={`${habit.name}, ${key}, frozen. Unfreeze`} title="Frozen. Click to unfreeze" onClick={() => freezeDay(habit, key, false)} className="grid size-8 place-items-center rounded-full border border-sky-300/50 bg-sky-300/10 text-sky-300 transition-all enabled:hover:scale-110"><Snowflake className="size-4" /></button>
                          ) : scheduled || complete ? (
                            <button type="button" disabled={future} aria-pressed={complete} aria-label={`${habit.name}, ${key}`} onClick={() => tick(habit, key, !complete)} className="grid size-8 place-items-center rounded-full border text-xs transition-all enabled:hover:scale-110 disabled:opacity-30" style={complete ? { borderColor: habitColor(habit.color), background: habitColor(habit.color), color: habitInk(habit.color) } : { borderColor: 'var(--border-strong)' }}>{complete ? '✓' : ''}</button>
                          ) : (
                            <span className="h-px w-3 bg-border" aria-hidden />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-4 border-l border-border px-5 text-sm"><strong>{rate}%</strong><span title="Current streak" className="flex items-center gap-1 text-orange-400"><Flame className="size-4" />{streak}{unit}</span><span title="Best streak" className="flex items-center gap-1 text-yellow-400"><Star className="size-4 fill-current" />{best}{unit}</span></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {dialog && (
        <HabitDialog
          key={dialog.habit?.id ?? 'new'}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          initial={dialog.habit && { name: dialog.habit.name, color: dialog.habit.color, days: dialog.habit.days, weeklyTarget: dialog.habit.weeklyTarget, timeOfDay: dialog.habit.timeOfDay }}
          onSubmit={save}
          onDelete={dialog.habit && (() => removeHabit(dialog.habit!))}
        />
      )}
    </div>
  );
}
