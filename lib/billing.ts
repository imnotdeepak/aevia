import 'server-only';

import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

import { getDb } from '@/lib/db';
import { subscription, user } from '@/lib/db/schema';
import { getStripe } from '@/lib/stripe';

/** Subscription statuses that keep the app unlocked. past_due stays open while Stripe retries the card. */
const ACCESS_STATUSES = ['active', 'trialing', 'past_due'];

export type SubscriptionInfo = {
  comped: boolean;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
};

export const hasAccess = (info: Pick<SubscriptionInfo, 'comped' | 'status'> | null) =>
  Boolean(info && (info.comped || (info.status !== null && ACCESS_STATUSES.includes(info.status))));

export async function loadSubscription(userId: string): Promise<SubscriptionInfo | null> {
  const [row] = await getDb().select().from(subscription).where(eq(subscription.userId, userId));
  if (!row) return null;
  return {
    comped: row.comped,
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    hasCustomer: Boolean(row.stripeCustomerId),
  };
}

const customerId = (value: string | Stripe.Customer | Stripe.DeletedCustomer) => (typeof value === 'string' ? value : value.id);

/** Find which of our users a Stripe subscription belongs to. */
async function userIdFor(sub: Stripe.Subscription) {
  if (sub.metadata?.userId) return sub.metadata.userId;
  const [row] = await getDb()
    .select({ userId: subscription.userId })
    .from(subscription)
    .where(eq(subscription.stripeCustomerId, customerId(sub.customer)));
  return row?.userId ?? null;
}

/** Record a Stripe subscription's current state. Safe to call repeatedly (webhooks can arrive twice). */
export async function saveSubscription(sub: Stripe.Subscription) {
  const userId = await userIdFor(sub);
  if (!userId) return false;

  // Events can arrive after an account was deleted (its subscription is cancelled on the way out).
  const [owner] = await getDb().select({ id: user.id }).from(user).where(eq(user.id, userId));
  if (!owner) return false;

  // In current Stripe API versions the billing period lives on the subscription item.
  const periodEnd = sub.items.data[0]?.current_period_end;
  const values = {
    stripeCustomerId: customerId(sub.customer),
    stripeSubscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    updatedAt: new Date(),
  };
  await getDb()
    .insert(subscription)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: subscription.userId, set: values });
  return true;
}

/** The user's Stripe customer id, creating the customer the first time. */
export async function getOrCreateCustomer(user: { id: string; email: string; name: string }) {
  const db = getDb();
  const [row] = await db.select().from(subscription).where(eq(subscription.userId, user.id));
  if (row?.stripeCustomerId) return row.stripeCustomerId;

  const customer = await getStripe().customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
  await db
    .insert(subscription)
    .values({ userId: user.id, stripeCustomerId: customer.id })
    .onConflictDoUpdate({ target: subscription.userId, set: { stripeCustomerId: customer.id, updatedAt: new Date() } });
  return customer.id;
}

/**
 * Pull the latest subscription state straight from Stripe. Used right after checkout so the user is
 * not stuck waiting for the webhook to arrive.
 */
export async function syncFromStripe(userId: string) {
  const [row] = await getDb().select().from(subscription).where(eq(subscription.userId, userId));
  if (!row?.stripeCustomerId) return;

  const { data } = await getStripe().subscriptions.list({ customer: row.stripeCustomerId, status: 'all', limit: 10 });
  const current = data.find((sub) => ACCESS_STATUSES.includes(sub.status)) ?? data[0];
  if (current) await saveSubscription(current);
}

/**
 * Cancel the user's Stripe subscription immediately so they are not billed again. Called while an
 * account is being deleted; if Stripe cannot be reached this throws, which stops the deletion.
 */
export async function cancelSubscriptionForUser(userId: string) {
  const [row] = await getDb().select().from(subscription).where(eq(subscription.userId, userId));
  if (!row?.stripeSubscriptionId || !row.status || ['canceled', 'incomplete_expired'].includes(row.status)) return;

  try {
    await getStripe().subscriptions.cancel(row.stripeSubscriptionId);
  } catch (error) {
    // Already cancelled or removed on Stripe's side is fine; anything else must not be ignored.
    if ((error as { code?: string }).code !== 'resource_missing') throw error;
  }
}
