import { openBillingPortal } from '@/app/billing-actions';
import type { SubscriptionInfo } from '@/lib/billing';

const MESSAGES: Record<string, string> = {
  'not-configured': 'Billing is not set up yet.',
  'no-subscription': 'There is no subscription to manage yet.',
  'portal-error': 'We could not open the billing page. Please try again.',
};

const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export function BillingSettings({ info, notice }: { info: SubscriptionInfo | null; notice?: string }) {
  const comped = info?.comped ?? false;
  const pastDue = info?.status === 'past_due';

  let status = 'Your Aevia subscription.';
  if (comped) status = 'Complimentary access. No payment needed.';
  else if (info?.cancelAtPeriodEnd && info.currentPeriodEnd) status = `Your access ends on ${formatDate(info.currentPeriodEnd)}.`;
  else if (info?.currentPeriodEnd) status = `Renews on ${formatDate(info.currentPeriodEnd)}.`;

  return (
    <section className="rounded-[2rem] border border-border bg-card p-8 sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Billing</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Your subscription</h2>
      <p className="mt-2 text-muted-foreground">{status}</p>
      {pastDue && <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">Your last payment did not go through. Update your card to keep your access.</p>}
      {notice && <p role="status" className="mt-4 text-sm text-muted-foreground">{MESSAGES[notice] ?? MESSAGES['portal-error']}</p>}
      {!comped && (
        <form action={openBillingPortal} className="mt-6">
          <button type="submit" className="h-11 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:border-[var(--border-strong)]">Manage billing</button>
        </form>
      )}
      {!comped && <p className="mt-3 text-xs text-muted-foreground">Update your card, see invoices, or cancel any time. Your price is locked in while you stay subscribed. Payments are non-refundable.</p>}
    </section>
  );
}
