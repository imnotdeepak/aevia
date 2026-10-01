'use client';

import { useCallback, useOptimistic, useState, useSyncExternalStore, useTransition } from 'react';

import { createHabit, deleteHabit, restoreHabit, setHabitCompletion, setHabitFreeze, updateHabit, type HabitInput } from '@/app/app/actions';
import { toDateKey, type HabitData } from '@/lib/habit-utils';

type Change =
  | { type: 'toggle'; id: string; date: string; done: boolean }
  | { type: 'freeze'; id: string; date: string; frozen: boolean }
  | { type: 'create'; id: string; input: HabitInput }
  | { type: 'update'; id: string; input: HabitInput }
  | { type: 'delete'; id: string }
  | { type: 'restore'; habit: HabitData };

function apply(habits: HabitData[], change: Change): HabitData[] {
  switch (change.type) {
    case 'toggle':
      return habits.map((item) => {
        if (item.id !== change.id) return item;
        const rest = item.completed.filter((date) => date !== change.date);
        return {
          ...item,
          completed: change.done ? [...rest, change.date] : rest,
          // Doing the habit after all gives the freeze token back.
          frozen: change.done ? item.frozen.filter((date) => date !== change.date) : item.frozen,
        };
      });
    case 'freeze':
      return habits.map((item) => {
        if (item.id !== change.id) return item;
        const rest = item.frozen.filter((date) => date !== change.date);
        return { ...item, frozen: change.frozen ? [...rest, change.date] : rest };
      });
    case 'create':
      return [...habits, { id: change.id, ...change.input, since: toDateKey(new Date()), completed: [], frozen: [] }];
    case 'update':
      return habits.map((item) => (item.id === change.id ? { ...item, ...change.input } : item));
    case 'delete':
      return habits.filter((item) => item.id !== change.id);
    case 'restore':
      return habits.some((item) => item.id === change.habit.id) ? habits : [...habits, change.habit];
  }
}

function subscribeToClock(onChange: () => void) {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
}

/** The user's local date. Empty during server rendering so it never mismatches on hydration. */
export function useToday() {
  return useSyncExternalStore(subscribeToClock, () => toDateKey(new Date()), () => '');
}

/** Habit list from the server with instant optimistic updates and background saves. */
export function useHabitsStore(initial: HabitData[]) {
  const [habits, change] = useOptimistic(initial, apply);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    (optimistic: Change, save: () => Promise<void>) => {
      setError(null);
      startTransition(async () => {
        change(optimistic);
        try {
          await save();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
        }
      });
    },
    [change],
  );

  return {
    habits,
    pending,
    error,
    clearError: () => setError(null),
    toggle: (id: string, date: string, done: boolean) =>
      run({ type: 'toggle', id, date, done }, () => setHabitCompletion(id, date, done)),
    freeze: (id: string, date: string, frozen: boolean) =>
      run({ type: 'freeze', id, date, frozen }, () => setHabitFreeze(id, date, frozen, toDateKey(new Date()))),
    create: (input: HabitInput) => run({ type: 'create', id: `tmp-${crypto.randomUUID()}`, input }, () => createHabit(input, toDateKey(new Date()))),
    update: (id: string, input: HabitInput) => run({ type: 'update', id, input }, () => updateHabit(id, input)),
    remove: (id: string) => run({ type: 'delete', id }, () => deleteHabit(id)),
    restore: (habit: HabitData) => run({ type: 'restore', habit }, () => restoreHabit(habit.id)),
  };
}
