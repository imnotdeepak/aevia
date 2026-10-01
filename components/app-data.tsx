'use client';

import { createContext, useContext } from 'react';

import { useHabitsStore } from '@/components/habits/use-habits';
import { useSaved } from '@/components/use-saved';
import type { HabitData } from '@/lib/habit-utils';
import type { BoardCardData, BoardStatus, TaskData } from '@/lib/planner';

export type TaskChange =
  | { type: 'add'; tasks: TaskData[] }
  | { type: 'done'; id: string; done: boolean }
  | { type: 'delete'; id: string };

function reduceTasks(tasks: TaskData[], change: TaskChange): TaskData[] {
  switch (change.type) {
    case 'add':
      return [...tasks, ...change.tasks];
    case 'done':
      return tasks.map((item) => (item.id === change.id ? { ...item, done: change.done } : item));
    case 'delete':
      return tasks.filter((item) => item.id !== change.id);
  }
}

export type BoardChange =
  | { type: 'add'; card: BoardCardData }
  | { type: 'edit'; id: string; title: string; notes: string }
  | { type: 'move'; id: string; status: BoardStatus; beforeId: string | null }
  | { type: 'delete'; id: string };

function reduceBoard(cards: BoardCardData[], change: BoardChange): BoardCardData[] {
  switch (change.type) {
    case 'add':
      return [...cards, change.card];
    case 'edit':
      return cards.map((card) => (card.id === change.id ? { ...card, title: change.title, notes: change.notes } : card));
    case 'delete':
      return cards.filter((card) => card.id !== change.id);
    case 'move': {
      const moving = cards.find((card) => card.id === change.id);
      if (!moving) return cards;
      const rest = cards.filter((card) => card.id !== change.id);
      const moved = { ...moving, status: change.status };
      const index = change.beforeId ? rest.findIndex((card) => card.id === change.beforeId) : -1;
      if (index === -1) return [...rest, moved];
      return [...rest.slice(0, index), moved, ...rest.slice(index)];
    }
  }
}

type AppData = {
  userName: string;
  habits: ReturnType<typeof useHabitsStore>;
  tasks: ReturnType<typeof useSaved<TaskData, TaskChange>>;
  board: ReturnType<typeof useSaved<BoardCardData, BoardChange>>;
};

const AppDataContext = createContext<AppData | null>(null);

/**
 * Holds the signed-in user's habits and tasks for the whole dashboard. It lives in the shared
 * layout, so switching tabs never refetches or loses optimistic changes.
 */
export function AppDataProvider({ userName, habits, tasks, board, children }: { userName: string; habits: HabitData[]; tasks: TaskData[]; board: BoardCardData[]; children: React.ReactNode }) {
  const value: AppData = { userName, habits: useHabitsStore(habits), tasks: useSaved(tasks, reduceTasks), board: useSaved(board, reduceBoard) };
  return <AppDataContext value={value}>{children}</AppDataContext>;
}

function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('Dashboard data is only available inside AppDataProvider.');
  return value;
}

export const useHabits = () => useAppData().habits;
export const useTasks = () => useAppData().tasks;
export const useBoard = () => useAppData().board;
export const useUserName = () => useAppData().userName;
