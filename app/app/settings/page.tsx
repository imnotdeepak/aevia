import Link from 'next/link';
import { headers } from 'next/headers';

import { AppearanceSettings } from '@/components/settings/appearance';
import { BillingSettings } from '@/components/settings/billing';
import { DataAndAccount } from '@/components/settings/data-and-account';
import { SignOutButton } from '@/components/sign-out-button';
import { getAuth } from '@/lib/auth';
import { loadSubscription } from '@/lib/billing';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const { billing } = await searchParams;
  const subscription = session ? await loadSubscription(session.user.id) : null;

  return (
    <div className="mx-auto grid max-w-3xl gap-6 pb-8">
      <section className="rounded-[2rem] border border-border bg-card p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Account</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Settings</h1>
        {session && (
          <p className="mt-4 text-muted-foreground">Signed in as <span className="text-foreground">{session.user.name}</span> ({session.user.email})</p>
        )}
        <div className="mt-6"><SignOutButton /></div>
      </section>

      <BillingSettings info={subscription} notice={billing} />

      <AppearanceSettings />

      <DataAndAccount />

      <nav aria-label="Legal" className="flex justify-center gap-6 text-sm text-muted-foreground">
        <Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link>
        <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
      </nav>
    </div>
  );
}
