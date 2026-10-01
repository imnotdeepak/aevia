'use client';

import { useHabits } from '@/components/app-data';
import { useUndo } from '@/components/undo';
import type { HabitData } from '@/lib/habit-utils';

/** Habit changes that are easy to do by accident, each followed by an "Undo" message. */
export function useHabitActions() {
  const { toggle, remove, restore, freeze } = useHabits();
  const notify = useUndo();

  const tick = (habit: HabitData, date: string, done: boolean) => {
    toggle(habit.id, date, done);
    notify(`${done ? 'Marked' : 'Unmarked'} "${habit.name}"`, () => toggle(habit.id, date, !done));
  };

  const removeHabit = (habit: HabitData) => {
    remove(habit.id);
    notify(`Deleted "${habit.name}"`, () => restore(habit));
  };

  const freezeDay = (habit: HabitData, date: string, frozen: boolean) => {
    freeze(habit.id, date, frozen);
    notify(`${frozen ? 'Froze' : 'Unfroze'} "${habit.name}"`, () => freeze(habit.id, date, !frozen));
  };

  return { tick, removeHabit, freezeDay };
}
