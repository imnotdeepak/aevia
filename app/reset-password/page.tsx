'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthLayout, FormError, FormField, fieldValue, linkClass, SubmitButton } from '@/components/auth/auth-ui';
import { authClient } from '@/lib/auth-client';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!token) {
    return <p className="text-muted-foreground">This reset link is invalid or has expired. <Link href="/forgot-password" className={linkClass}>Request a new one</Link>.</p>;
  }

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = fieldValue(form, 'password');
    if (newPassword !== fieldValue(form, 'confirm')) return setError('Passwords do not match.');
    setError(null);
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword, token: token! });
    setPending(false);
    if (error) return setError(error.message ?? 'Could not reset your password.');
    router.push('/login');
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormField id="password" label="New password" type="password" autoComplete="new-password" minLength={8} required />
      <FormField id="confirm" label="Confirm new password" type="password" autoComplete="new-password" minLength={8} required />
      <FormError message={error} />
      <SubmitButton pending={pending}>Set new password</SubmitButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Choose a new password" footer={<Link href="/login" className={linkClass}>Back to sign in</Link>}>
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}
