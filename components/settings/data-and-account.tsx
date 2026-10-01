'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authClient } from '@/lib/auth-client';

export function DataAndAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function deleteAccount(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const { error: failure } = await authClient.deleteUser({ password });
    if (failure) {
      setPending(false);
      return setError(failure.message ?? 'Could not delete your account. Check your password and try again.');
    }
    router.push('/');
    router.refresh();
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-8 sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Your data</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Export or delete</h2>
      <p className="mt-2 text-muted-foreground">Your habits, tasks and board belong to you. Download a copy any time, or remove everything for good.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/api/export" download className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:border-[var(--border-strong)]">
          <Download className="size-4" />Download my data
        </a>
        <button type="button" onClick={() => setOpen(true)} className="flex h-11 items-center gap-2 rounded-full border border-destructive/40 px-5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
          <Trash2 className="size-4" />Delete my account
        </button>
      </div>

      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <form className="grid gap-5" onSubmit={deleteAccount}>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your habits and their history, tasks, board and settings. Your subscription is cancelled right away, so you will not be charged again. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <label className="grid gap-2 text-sm font-medium">
              Enter your password to confirm
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3.5 text-base outline-none focus:border-[var(--accent)]" />
            </label>
            {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>Keep my account</Button>
              <Button type="submit" variant="destructive" disabled={pending || password.length === 0}>{pending ? 'Deleting…' : 'Delete forever'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
