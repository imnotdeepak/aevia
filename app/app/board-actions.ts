'use server';

import { randomUUID } from 'node:crypto';

import { and, asc, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getDb } from '@/lib/db';
import { boardCard } from '@/lib/db/schema';
import { requireSession } from '@/lib/habits';
import { isBoardStatus } from '@/lib/planner';

function cleanTitle(title: string) {
  const value = title.trim().slice(0, 120);
  if (!value) throw new Error('Give the card a title.');
  return value;
}

const refresh = () => revalidatePath('/app', 'layout');

export async function createCard(title: string, status: string, notes = '') {
  const { user } = await requireSession();
  if (!isBoardStatus(status)) throw new Error('Unknown column.');
  await getDb()
    .insert(boardCard)
    .values({ id: randomUUID(), userId: user.id, title: cleanTitle(title), notes: notes.trim().slice(0, 2000), status, position: Math.floor(Date.now() / 1000) });
  refresh();
}

export async function updateCard(id: string, input: { title: string; notes: string }) {
  const { user } = await requireSession();
  await getDb()
    .update(boardCard)
    .set({ title: cleanTitle(input.title), notes: input.notes.trim().slice(0, 2000) })
    .where(and(eq(boardCard.id, id), eq(boardCard.userId, user.id)));
  refresh();
}

export async function deleteCard(id: string) {
  const { user } = await requireSession();
  await getDb()
    .delete(boardCard)
    .where(and(eq(boardCard.id, id), eq(boardCard.userId, user.id)));
  refresh();
}

/** Move a card into a column, placing it before `beforeId` or at the end when that is null. */
export async function moveCard(id: string, status: string, beforeId: string | null) {
  const { user } = await requireSession();
  if (!isBoardStatus(status)) throw new Error('Unknown column.');
  const db = getDb();

  const [card] = await db
    .select({ id: boardCard.id })
    .from(boardCard)
    .where(and(eq(boardCard.id, id), eq(boardCard.userId, user.id)));
  if (!card) throw new Error('Card not found.');

  const others = await db
    .select({ id: boardCard.id })
    .from(boardCard)
    .where(and(eq(boardCard.userId, user.id), eq(boardCard.status, status), ne(boardCard.id, id)))
    .orderBy(asc(boardCard.position), asc(boardCard.createdAt));

  const order = others.map((row) => row.id);
  const index = beforeId ? order.indexOf(beforeId) : -1;
  order.splice(index === -1 ? order.length : index, 0, id);

  await Promise.all(
    order.map((cardId, position) =>
      db
        .update(boardCard)
        .set(cardId === id ? { status, position } : { position })
        .where(and(eq(boardCard.id, cardId), eq(boardCard.userId, user.id))),
    ),
  );
  refresh();
}
