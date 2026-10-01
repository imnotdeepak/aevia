import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarCheck2, Check, Flame, Columns3, Grid3X3, Snowflake } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/paper-design-shader-background';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Grid3X3,
    title: 'Habits that respect your schedule',
    body: 'Daily, specific weekdays, or "3 times a week". A Monday/Wednesday/Friday habit never breaks on Tuesday.',
    className: 'lg:col-span-3',
    visual: (
      <div className="mt-6 grid grid-cols-10 gap-1.5" aria-hidden>
        {Array.from({ length: 30 }, (_, i) => (
          <span key={i} className={cn('aspect-square rounded-full border', (i * 7) % 5 === 0 ? 'border-[var(--border-strong)]' : 'border-[var(--accent)] bg-[var(--accent)]')} />
        ))}
      </div>
    ),
  },
  {
    icon: CalendarCheck2,
    title: 'A week you can actually plan',
    body: "Seven columns, one per day, with a quick way to copy yesterday's list.",
    className: 'lg:col-span-3',
    visual: (
      <div className="mt-6 flex h-20 items-end gap-2" aria-hidden>
        {[67, 100, 50, 67, 100, 30, 0].map((v, i) => (
          <div key={i} className="flex h-full flex-1 items-end overflow-hidden rounded-xl bg-[var(--surface-elevated)]"><span className="w-full rounded-xl bg-gradient-to-t from-[var(--accent-2)] to-[var(--accent)]" style={{ height: `${v}%` }} /></div>
        ))}
      </div>
    ),
  },
  {
    icon: Columns3,
    title: 'A board for bigger work',
    body: 'Move projects through To do, In progress and Done. Drag a card, or tap an arrow.',
    className: 'lg:col-span-3',
    visual: (
      <div className="mt-6 grid grid-cols-3 gap-2" aria-hidden>
        {[2, 1, 1].map((count, column) => (
          <div key={column} className="space-y-1.5 rounded-xl bg-[var(--surface-elevated)] p-2">
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className={cn('block h-5 rounded-md', column === 2 ? 'bg-[var(--accent)]' : 'border border-[var(--border-strong)]')} />
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: 'Insights from what you already log',
    body: 'Consistency trends, week-over-week change, your best streaks, and the habit that needs attention.',
    className: 'lg:col-span-3',
    visual: (
      <svg viewBox="0 0 400 80" className="mt-6 h-20 w-full" aria-hidden>
        <defs><linearGradient id="lp-stroke" x1="0" x2="1" y1="0" y2="0"><stop stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient><linearGradient id="lp-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="var(--accent)" stopOpacity=".3" /><stop offset="1" stopColor="var(--accent-2)" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 55 L50 48 L100 58 L150 40 L200 34 L250 42 L300 22 L350 28 L400 12 L400 80 L0 80Z" fill="url(#lp-fill)" />
        <path d="M0 55 L50 48 L100 58 L150 40 L200 34 L250 42 L300 22 L350 28 L400 12" fill="none" stroke="url(#lp-stroke)" strokeWidth="2.5" />
      </svg>
    ),
  },
];

const steps = [
  ['01', 'Add what matters', 'Create a few habits and tasks in under two minutes. Start small.'],
  ['02', 'Check in daily', 'One tap per habit, and one tick per task.'],
  ['03', 'See the pattern', 'Aevia turns tiny inputs into streaks, trends and honest feedback.'],
];

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <main className="relative isolate flex min-h-screen w-full flex-col overflow-hidden">
        <GradientBackground />
        <div className="absolute inset-0 -z-10 bg-black/20" />

        <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-lg font-semibold tracking-[-0.03em] text-white">aevia</Link>
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-none border-white bg-transparent px-5 text-white hover:bg-white hover:text-black dark:border-white dark:bg-transparent dark:hover:bg-white')}>
            Log in
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center px-6 pb-24 pt-8">
          <div className="max-w-4xl text-center">
            <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-white/80">Personal consistency, clearly seen</p>
            <h1 className="text-balance text-5xl font-light tracking-tight text-white sm:text-6xl lg:text-7xl">Build better days, one check&#8209;in at a time.</h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-white/80">Track habits, plan your week, and see the progress that is easy to miss day to day.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className={cn(buttonVariants(), 'h-12 gap-2 rounded-none border border-white bg-transparent px-7 text-base font-medium text-white hover:bg-white hover:text-black has-data-[icon=inline-end]:pr-7')}>
                Start your day
                <ArrowRight data-icon="inline-end" />
              </Link>
              <a href="#features" className={cn(buttonVariants({ variant: 'ghost' }), 'h-12 rounded-none border border-white/40 px-7 text-base font-medium text-white hover:border-white hover:bg-white/10 hover:text-white')}>See how it works</a>
            </div>
          </div>
        </section>
      </main>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-24 sm:px-8 sm:py-32">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Everything in one place</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Five pages. <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">No clutter.</span></h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">Aevia stays focused on habits, tasks, a board for bigger work, and the insights that connect them.</p>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-6">
          {features.map(({ icon: Icon, title, body, visual, className }) => (
            <article key={title} className={cn('rounded-[1.75rem] border border-border bg-card p-7 transition-colors hover:border-[var(--accent)]/40', className)}>
              <Icon className="size-6 text-[var(--accent)]" />
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
              {visual}
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
          <h2 className="max-w-xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">A daily habit for building <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">daily habits.</span></h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {steps.map(([num, title, body]) => (
              <li key={num}>
                <span className="text-sm font-semibold tabular-nums text-[var(--accent-2)]">{num}</span>
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Streaks that forgive</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Miss a day without losing your <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">momentum.</span></h2>
          <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
            Earn a freeze token for every strong week, and keep up to three in reserve. Use one to protect a streak when life gets in the way.
          </p>
          <ul className="mt-8 space-y-3 text-muted-foreground">
            {['Streaks follow your schedule, not the calendar', 'Frozen days are marked clearly and never count as completed', 'Your history stays accurate, even after you change a habit'].map((point) => (
              <li key={point} className="flex items-start gap-3"><Check className="mt-1 size-4 shrink-0 text-[var(--accent)]" strokeWidth={3} />{point}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[2rem] border border-border bg-card p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-2xl font-semibold"><Flame className="size-6 text-[var(--accent-2)]" />12 day streak</p>
            <p className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"><Snowflake className="size-4" />3 freezes</p>
          </div>
          <div className="mt-8 grid grid-cols-7 gap-2" aria-label="Last two weeks">
            {['done', 'done', 'done', 'frozen', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'today'].map((state, i) => (
              <span key={i} className={cn('grid aspect-square place-items-center rounded-2xl border', state === 'done' && 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]', state === 'frozen' && 'border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent)]', state === 'today' && 'border-dashed border-[var(--border-strong)]')}>
                {state === 'done' && <Check className="size-4" strokeWidth={3} />}
                {state === 'frozen' && <Snowflake className="size-4" />}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Thursday was frozen, so the streak carried on.</p>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-2)]">Pricing</p>
        <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Simple pricing.</h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-muted-foreground">One plan, one price, with everything included. No tiers, no upsells.</p>
        <div className="relative mx-auto mt-12 max-w-md overflow-hidden rounded-[2rem] border border-[var(--accent)]/20 bg-[var(--accent)]/[0.07] p-10">
          <p className="relative text-7xl font-semibold tracking-[-0.05em]">
            <span className="text-[var(--accent)]">$2</span>
            <span className="ml-2 text-xl font-normal tracking-normal text-muted-foreground">/ month</span>
          </p>
          <p className="relative mt-4 font-medium">Your price is locked in.</p>
          <ul className="relative mt-6 space-y-3 border-t border-[var(--accent)]/20 pt-6 text-left text-foreground/80">
            {[
              'Sign up at $2 a month and that price is yours for as long as you stay subscribed',
              'Prices may rise for new customers, never for existing ones',
              'No hidden fees, add-ons or premium tiers',
              'Cancel any time. Payments are non-refundable.',
            ].map((point) => (
              <li key={point} className="flex items-start gap-3"><Check className="mt-1 size-4 shrink-0 text-[var(--accent)]" strokeWidth={3} />{point}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-t border-border">
        <GradientBackground />
        <div className="absolute inset-0 -z-10 bg-black/40" />
        <div className="mx-auto max-w-6xl px-5 py-28 text-center sm:px-8 sm:py-40">
          <h2 className="mx-auto max-w-2xl text-balance text-4xl font-light tracking-tight text-white sm:text-6xl">Start with today.</h2>
          <p className="mx-auto mt-5 max-w-md text-lg leading-8 text-white/80">It takes about two minutes to set up. Everything after that is one tap a day.</p>
          <Link href="/signup" className={cn(buttonVariants(), 'mt-9 h-12 gap-2 rounded-none border border-white bg-transparent px-7 text-base font-medium text-white hover:bg-white hover:text-black has-data-[icon=inline-end]:pr-7')}>
            Create your account
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <span className="font-semibold text-foreground">aevia</span>
          <span>Personal consistency, clearly seen.</span>
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
