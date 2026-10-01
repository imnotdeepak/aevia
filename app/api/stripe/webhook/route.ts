import type Stripe from 'stripe';

import { saveSubscription } from '@/lib/billing';
import { getStripe } from '@/lib/stripe';

// Stripe calls this endpoint when a subscription is created, changed, paid for or cancelled.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) return new Response('Webhook is not configured', { status: 400 });

  // The signature is computed over the exact raw body, so read it as text, not JSON.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          await saveSubscription(await getStripe().subscriptions.retrieve(id));
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await saveSubscription(event.data.object);
        break;
    }
  } catch (error) {
    console.error('[stripe] Webhook handler failed', event.type, error);
    // A 500 makes Stripe retry the event later.
    return new Response('Handler failed', { status: 500 });
  }

  return new Response(null, { status: 200 });
}
