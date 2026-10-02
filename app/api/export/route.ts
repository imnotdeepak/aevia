import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { boardCard, consent, habit, habitCompletion, habitFreeze, subscription, task, user, userSettings } from '@/lib/db/schema';

// Everything Aevia stores about the signed-in user, as a JSON download.
export async function GET() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return new Response('Not signed in', { status: 401 });

  const db = getDb();
  const id = session.user.id;
  const [account, habits, completions, freezes, tasks, cards, settings, billing, agreements] = await Promise.all([
    db.select({ name: user.name, email: user.email, createdAt: user.createdAt }).from(user).where(eq(user.id, id)),
    db.select().from(habit).where(eq(habit.userId, id)),
    db.select().from(habitCompletion).where(eq(habitCompletion.userId, id)),
    db.select().from(habitFreeze).where(eq(habitFreeze.userId, id)),
    db.select().from(task).where(eq(task.userId, id)),
    db.select().from(boardCard).where(eq(boardCard.userId, id)),
    db.select().from(userSettings).where(eq(userSettings.userId, id)),
    db.select().from(subscription).where(eq(subscription.userId, id)),
    db.select().from(consent).where(eq(consent.userId, id)),
  ]);

  const datesFor = (rows: { habitId: string; date: string }[], habitId: string) =>
    rows.filter((row) => row.habitId === habitId).map((row) => row.date).sort();

  const data = {
    exportedAt: new Date().toISOString(),
    account: account[0] ?? null,
    habits: habits
      .filter((row) => !row.deletedAt)
      .map((row) => ({
        name: row.name,
        color: row.color,
        repeatsOnWeekdays: row.days.split('').map(Number),
        timesPerWeek: row.weeklyTarget,
        timeOfDay: row.timeOfDay,
        startedOn: row.startDate,
        completedOn: datesFor(completions, row.id),
        frozenOn: datesFor(freezes, row.id),
      })),
    tasks: tasks.map((row) => ({ title: row.title, date: row.date, done: row.done })),
    board: cards.map((row) => ({ title: row.title, notes: row.notes, column: row.status })),
    appearance: settings[0] ? { accent: settings[0].accent, background: settings[0].background, text: settings[0].foreground } : null,
    agreedTo: agreements.map((row) => ({ document: row.document, version: row.version, acceptedAt: row.acceptedAt })),
    // Payment card details are held by Stripe, not by Aevia.
    subscription: billing[0]
      ? { status: billing[0].status, complimentary: billing[0].comped, currentPeriodEnd: billing[0].currentPeriodEnd, cancelsAtPeriodEnd: billing[0].cancelAtPeriodEnd }
      : null,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="aevia-data-${stamp}.json"`,
      'cache-control': 'no-store',
    },
  });
}
