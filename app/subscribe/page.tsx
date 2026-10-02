import { Check } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { startCheckout } from '@/app/billing-actions';
import { AuthLayout, FormError, SubmitButton } from '@/components/auth/auth-ui';
import { SignOutButton } from '@/components/sign-out-button';
import { hasAccess, loadSubscription, syncFromStripe } from '@/lib/billing';
import { requireSession } from '@/lib/habits';
import { PRICE_LABEL, PRICE_PER_MONTH } from '@/lib/pricing';
import { stripeConfigured } from '@/lib/stripe';

const POINTS = [
  `Sign up at ${PRICE_PER_MONTH} and that price is yours for as long as you stay subscribed`,
  'Prices may rise for new customers, never for existing ones',
  'No hidden fees, add-ons or premium tiers',
  'Cancel any time',
];

const ERRORS: Record<string, string> = {
  'not-configured': 'Payments are not set up yet. Please try again later.',
  checkout: 'We could not start checkout. Please try again.',
};

export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ checkout?: string; error?: string }> }) {
  const { user } = await requireSession();
  const { checkout, error } = await searchParams;

  let info = await loadSubscription(user.id);
  // Coming back from Stripe: read the result directly, in case the webhook has not arrived yet.
  if (checkout === 'success' && !hasAccess(info) && stripeConfigured()) {
    try {
      await syncFromStripe(user.id);
    } catch (caught) {
      console.error('[billing] Could not confirm the subscription with Stripe', caught);
    }
    info = await loadSubscription(user.id);
  }
  if (hasAccess(info)) redirect('/app/today');

  return (
    <AuthLayout title="One more step" subtitle="Start your subscription to open your dashboard.">
      <div className="space-y-6">
        <div>
          <p className="text-6xl font-semibold tracking-[-0.05em]">
            <span className="text-[var(--accent)]">{PRICE_LABEL}</span>
            <span className="ml-2 text-lg font-normal tracking-normal text-muted-foreground">/ month</span>
          </p>
          <p className="mt-2 font-medium">Your price is locked in.</p>
        </div>
        <ul className="space-y-3 border-t border-border pt-5 text-sm text-foreground/80">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" strokeWidth={3} />{point}</li>
          ))}
        </ul>
        {checkout === 'cancelled' && <p className="text-sm text-muted-foreground">Checkout was cancelled. You have not been charged.</p>}
        {checkout === 'success' && <p className="text-sm text-muted-foreground">We are still confirming your payment. Refresh in a few seconds.</p>}
        <FormError message={error ? (ERRORS[error] ?? ERRORS.checkout) : null} />
        <form action={startCheckout}>
          <SubmitButton>Subscribe for {PRICE_PER_MONTH}</SubmitButton>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Cancel any time to stop future charges. Payments are non-refundable (see the <Link href="/terms" target="_blank" className="underline underline-offset-4 hover:text-foreground">Terms</Link>).
        </p>
        <p className="text-center text-xs text-muted-foreground">Secure payment by Stripe. Signed in as {user.email}.</p>
      </div>
      <div className="mt-6 flex justify-center border-t border-border pt-5"><SignOutButton /></div>
    </AuthLayout>
  );
}
