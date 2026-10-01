'use client';

import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push('/login');
        router.refresh();
      }}
      className="h-11 rounded-none border border-border px-6 text-sm font-medium transition-colors hover:border-[var(--border-strong)] hover:bg-muted"
    >
      Sign out
    </button>
  );
}
