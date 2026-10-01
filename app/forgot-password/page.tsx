'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AuthLayout, FormError, FormField, fieldValue, linkClass, SubmitButton } from '@/components/auth/auth-ui';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);
    const { error } = await authClient.requestPasswordReset({
      email: fieldValue(form, 'email'),
      redirectTo: '/reset-password',
    });
    setPending(false);
    if (error) return setError(error.message ?? 'Could not send the reset link.');
    setSent(true);
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={<Link href="/login" className={linkClass}>Back to sign in</Link>}
    >
      {sent ? (
        <p className="text-muted-foreground">If an account exists for that email, a reset link is on its way.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <FormField id="email" label="Email" type="email" autoComplete="email" required />
          <FormError message={error} />
          <SubmitButton pending={pending}>Send reset link</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
