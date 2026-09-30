'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarCheck2, Grid3X3, House, Settings, Target } from 'lucide-react';

const navigation = [
  { label: 'Today', href: '/app/today', icon: House },
  { label: 'Habits', href: '/app/habits', icon: Grid3X3 },
  { label: 'Tasks', href: '/app/tasks', icon: CalendarCheck2 },
  { label: 'Goals', href: '/app/goals', icon: Target },
  { label: 'Insights', href: '/app/insights', icon: BarChart3 },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = navigation.find((item) => pathname.startsWith(item.href)) ?? navigation[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto grid h-24 w-[min(calc(100%-32px),1800px)] grid-cols-[1fr_auto_1fr] items-center">
        <p className="text-lg font-semibold uppercase tracking-[-0.035em]">{active.label}</p>
        <nav className="hidden items-center rounded-full border border-border bg-card p-1.5 md:flex" aria-label="Dashboard">
          {navigation.map(({ label, href, icon: Icon }) => {
            const selected = pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={selected ? 'page' : undefined} className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${selected ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Icon className="size-4" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="flex justify-end">
          <Link href="/app/settings" aria-label="Settings" className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Settings className="size-5" /></Link>
        </div>
      </header>
      <main className="mx-auto w-[min(calc(100%-32px),1800px)] pb-24">{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-20 flex justify-around rounded-2xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur md:hidden" aria-label="Dashboard mobile">
        {navigation.map(({ label, href, icon: Icon }) => {
          const selected = pathname.startsWith(href);
          return <Link key={href} href={href} aria-label={label} aria-current={selected ? 'page' : undefined} className={`grid size-11 place-items-center rounded-xl ${selected ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-muted-foreground'}`}><Icon className="size-5" /></Link>;
        })}
      </nav>
    </div>
  );
}
