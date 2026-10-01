'use server';

import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getDb } from '@/lib/db';
import { task } from '@/lib/db/schema';
import { DATE_PATTERN } from '@/lib/habit-utils';
import { requireSession } from '@/lib/habits';

function cleanTitle(title: string) {
  const value = title.trim().slice(0, 120);
  if (!value) throw new Error('Give the task a name.');
  return value;
}

function checkDate(date: string) {
  if (!DATE_PATTERN.test(date)) throw new Error('Invalid date.');
}

const refresh = () => revalidatePath('/app', 'layout');

export async function createTasks(entries: { title: string; date: string; done?: boolean }[]) {
  const { user } = await requireSession();
  if (entries.length === 0 || entries.length > 50) throw new Error('Nothing to add.');
  const rows = entries.map(({ title, date, done }) => {
    checkDate(date);
    return { id: randomUUID(), userId: user.id, title: cleanTitle(title), date, done: Boolean(done) };
  });
  await getDb().insert(task).values(rows);
  refresh();
}

export async function setTaskDone(id: string, done: boolean) {
  const { user } = await requireSession();
  await getDb()
    .update(task)
    .set({ done })
    .where(and(eq(task.id, id), eq(task.userId, user.id)));
  refresh();
}

export async function renameTask(id: string, title: string) {
  const { user } = await requireSession();
  await getDb()
    .update(task)
    .set({ title: cleanTitle(title) })
    .where(and(eq(task.id, id), eq(task.userId, user.id)));
  refresh();
}

export async function deleteTask(id: string) {
  const { user } = await requireSession();
  await getDb()
    .delete(task)
    .where(and(eq(task.id, id), eq(task.userId, user.id)));
  refresh();
}
