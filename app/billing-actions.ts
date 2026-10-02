'use server';

import { redirect } from 'next/navigation';

import { getOrCreateCustomer, loadSubscription } from '@/lib/billing';
import { requireSession } from '@/lib/habits';
import { PRICE_CENTS, PRICE_PER_MONTH } from '@/lib/pricing';
import { appUrl, getStripe, stripeConfigured } from '@/lib/stripe';

/** The subscription price (see lib/pricing). Uses a fixed Stripe Price when STRIPE_PRICE_ID is set, otherwise defines it inline. */
async function lineItem() {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (priceId) {
    // Never charge an amount that differs from the one customers were shown.
    const price = await getStripe().prices.retrieve(priceId);
    if (price.unit_amount !== PRICE_CENTS || price.currency !== 'usd' || price.recurring?.interval !== 'month') {
      throw new Error(`STRIPE_PRICE_ID does not match the price shown to customers (expected ${PRICE_PER_MONTH} in USD)`);
    }
    return { price: priceId, quantity: 1 };
  }
  return {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: PRICE_CENTS,
      recurring: { interval: 'month' as const },
      product_data: { name: 'Aevia', description: `Habits, tasks, board and insights. ${PRICE_PER_MONTH}, and your price is locked in while you stay subscribed.` },
    },
  };
}

/** Send the signed-in user to Stripe Checkout to start the subscription. */
export async function startCheckout() {
  const { user } = await requireSession();
  if (!stripeConfigured()) redirect('/subscribe?error=not-configured');

  let url: string | null = null;
  try {
    const customer = await getOrCreateCustomer(user);
    const item = await lineItem();
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [item],
      subscription_data: { metadata: { userId: user.id } },
      // Shown next to the pay button on Stripe's page, so the policy is visible at the moment of purchase.
      custom_text: { submit: { message: 'Payments are non-refundable. Cancel any time to stop future charges.' } },
      success_url: `${appUrl()}/subscribe?checkout=success`,
      cancel_url: `${appUrl()}/subscribe?checkout=cancelled`,
    });
    url = session.url;
  } catch (error) {
    console.error('[billing] Could not start checkout', error);
  }
  // redirect() works by throwing, so it must stay outside the try block.
  redirect(url ?? '/subscribe?error=checkout');
}

/** Open Stripe's billing portal, where the user can update their card, see invoices or cancel. */
export async function openBillingPortal() {
  const { user } = await requireSession();
  if (!stripeConfigured()) redirect('/app/settings?billing=not-configured');

  const info = await loadSubscription(user.id);
  if (!info?.hasCustomer) redirect('/app/settings?billing=no-subscription');

  let url: string | null = null;
  try {
    const customer = await getOrCreateCustomer(user);
    const session = await getStripe().billingPortal.sessions.create({ customer, return_url: `${appUrl()}/app/settings` });
    url = session.url;
  } catch (error) {
    console.error('[billing] Could not open the billing portal', error);
  }
  redirect(url ?? '/app/settings?billing=portal-error');
}
