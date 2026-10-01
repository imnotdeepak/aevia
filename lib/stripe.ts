import 'server-only';

import Stripe from 'stripe';

let instance: Stripe | undefined;

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

/** Created on first use so the key is read at request time, not while the module loads. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return (instance ??= new Stripe(key));
}

/** The public address of the app, used for Stripe's return links. */
export const appUrl = () => (process.env.BETTER_AUTH_URL ?? 'http://localhost:3001').replace(/\/$/, '');
