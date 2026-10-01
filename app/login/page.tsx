'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AuthLayout, FormError, FormField, fieldValue, linkClass, SubmitButton } from '@/components/auth/auth-ui';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email: fieldValue(form, 'email'),
      password: fieldValue(form, 'password'),
    });
    if (error) {
      setPending(false);
      return setError(error.message ?? 'Could not sign in.');
    }
    // Stay in the loading state while the dashboard opens; leaving the page ends it.
    router.push('/app/today');
    router.refresh();
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your streak."
      footer={<>New to Aevia? <Link href="/signup" className={linkClass}>Create an account</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormField id="email" label="Email" type="email" autoComplete="email" required />
        <FormField id="password" label="Password" type="password" autoComplete="current-password" required />
        <div className="text-right text-sm"><Link href="/forgot-password" className={linkClass}>Forgot password?</Link></div>
        <FormError message={error} />
        <SubmitButton pending={pending} pendingLabel="Signing in">Sign in</SubmitButton>
      </form>
    </AuthLayout>
  );
}
