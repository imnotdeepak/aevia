'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AuthLayout, FormError, FormField, fieldValue, linkClass, SubmitButton } from '@/components/auth/auth-ui';
import { authClient } from '@/lib/auth-client';
import { PRICE_PER_MONTH } from '@/lib/pricing';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = fieldValue(form, 'password');
    if (password !== fieldValue(form, 'confirm')) return setError('Passwords do not match.');
    setError(null);
    setPending(true);
    const { error } = await authClient.signUp.email({
      name: fieldValue(form, 'name'),
      email: fieldValue(form, 'email'),
      password,
      // Read by the server, which refuses to create the account without it (see lib/auth.ts).
      acceptedTerms: fieldValue(form, 'terms') === 'on',
    } as Parameters<typeof authClient.signUp.email>[0]);
    if (error) {
      setPending(false);
      return setError(error.message ?? 'Could not create your account.');
    }
    // Stay in the loading state while the next page opens; leaving the page ends it.
    router.push('/app/today');
    router.refresh();
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={`${PRICE_PER_MONTH}, and your price is locked in while you stay.`}
      footer={<>Already have an account? <Link href="/login" className={linkClass}>Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormField id="name" label="Name" autoComplete="name" required />
        <FormField id="email" label="Email" type="email" autoComplete="email" required />
        <FormField id="password" label="Password" type="password" autoComplete="new-password" minLength={8} required />
        <FormField id="confirm" label="Confirm password" type="password" autoComplete="new-password" minLength={8} required />
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input type="checkbox" name="terms" required className="mt-1 size-4 accent-[var(--accent)]" />
          <span>I agree to the <Link href="/terms" target="_blank" className="underline underline-offset-4 hover:text-foreground">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.</span>
        </label>
        <FormError message={error} />
        <SubmitButton pending={pending} pendingLabel="Creating your account">Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
}
