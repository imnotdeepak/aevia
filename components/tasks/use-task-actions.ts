'use client';

import { createTasks, deleteTask, setTaskDone } from '@/app/app/task-actions';
import { useTasks } from '@/components/app-data';
import { useUndo } from '@/components/undo';
import type { TaskData } from '@/lib/planner';

/** Task changes that are easy to do by accident, each followed by an "Undo" message. */
export function useTaskActions() {
  const { run } = useTasks();
  const notify = useUndo();

  const setDone = (item: TaskData, done: boolean) => run({ type: 'done', id: item.id, done }, () => setTaskDone(item.id, done));

  const toggleTask = (item: TaskData) => {
    const done = !item.done;
    setDone(item, done);
    notify(`${done ? 'Completed' : 'Reopened'} "${item.title}"`, () => setDone(item, !done));
  };

  const removeTask = (item: TaskData) => {
    run({ type: 'delete', id: item.id }, () => deleteTask(item.id));
    notify(`Deleted "${item.title}"`, () => {
      const entry = { title: item.title, date: item.date, done: item.done };
      run({ type: 'add', tasks: [{ id: `tmp-${crypto.randomUUID()}`, ...entry }] }, () => createTasks([entry]));
    });
  };

  return { toggleTask, removeTask };
}
