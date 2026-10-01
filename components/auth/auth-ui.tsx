import Link from 'next/link';

import { LoadingOrb } from '@/components/auth/loading-orb';
import { GradientBackground } from '@/components/ui/paper-design-shader-background';
import { cn } from '@/lib/utils';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden px-5 text-white">
      <GradientBackground />
      <div className="absolute inset-0 -z-10 bg-black/65" />
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center">
        <Link href="/" className="text-lg font-semibold tracking-[-0.03em]">aevia</Link>
      </header>
      <div className="flex flex-1 items-center justify-center pb-24">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
          {subtitle && <p className="mt-2 text-white/80">{subtitle}</p>}
          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-black/70 p-7 text-foreground backdrop-blur-xl">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-white/80">{footer}</p>}
        </div>
      </div>
    </main>
  );
}

export function FormField({ label, id, ...props }: { label: string; id: string } & React.ComponentProps<'input'>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input
        id={id}
        name={id}
        {...props}
        className="h-11 w-full rounded-xl border border-input bg-[var(--surface-elevated)] px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
      />
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{message}</p>;
}

export function SubmitButton({ children, pending, pendingLabel = 'Please wait', className }: { children: React.ReactNode; pending?: boolean; pendingLabel?: string; className?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn('h-12 w-full bg-[var(--accent)] font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-wait disabled:opacity-90', className)}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-3">
          <LoadingOrb />
          {pendingLabel}…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export const linkClass = 'font-medium text-[var(--accent)] hover:underline';

export function fieldValue(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
