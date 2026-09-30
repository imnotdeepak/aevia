import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-5 text-foreground sm:px-8">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-[-0.03em]">kiyo</Link>
        <Link href="/app/today" className={buttonVariants({ variant: 'outline', className: 'h-10 rounded-full px-5' })}>
          Open dashboard
        </Link>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-14 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:py-8">
        <div className="max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Personal consistency, clearly seen</p>
          <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">Build better days, one check-in at a time.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground">Track habits, plan your week, and see the progress that is easy to miss day to day.</p>
          <Link href="/app/today" className={buttonVariants({ className: 'mt-9 h-12 rounded-full bg-[var(--accent)] px-6 text-base font-semibold text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]' })}>
            Start your day
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-2xl" aria-label="Kiyo dashboard preview">
          <div className="absolute -inset-10 -z-10 rounded-full bg-[var(--accent-glow)] blur-3xl" />
          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tuesday</p><p className="mt-1 text-xl font-semibold">Today</p></div>
              <div className="grid size-20 place-items-center rounded-full bg-[conic-gradient(var(--accent)_0_78%,var(--surface-elevated)_78%)]">
                <div className="grid size-16 place-items-center rounded-full bg-card text-lg font-semibold">78%</div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['Morning walk', 'Read 10 pages', 'Plan tomorrow', 'Meditate'].map((habit, index) => (
                <div key={habit} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-[var(--surface-elevated)] px-4">
                  <span className={`grid size-7 place-items-center rounded-full border ${index < 3 ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 'border-[var(--border-strong)] text-transparent'}`}>
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  <span className="font-medium">{habit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
