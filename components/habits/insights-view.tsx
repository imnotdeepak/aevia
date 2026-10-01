'use client';

import { useState } from 'react';
import { ChevronDown, Flame, Medal } from 'lucide-react';

import { Panel } from '@/components/dashboard-visuals';
import { useHabits } from '@/components/app-data';
import { useToday } from '@/components/habits/use-habits';
import { addDays, bestStreak, consistency, currentStreak, dayProgress, formatStreak, fromDateKey, habitColor, isWeekly, streakInDays } from '@/lib/habit-utils';

const RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];
const LEADERBOARD_PERIODS = [
  { label: 'D', title: 'Today', days: 1 },
  { label: 'W', title: 'Last 7 days', days: 7 },
  { label: 'M', title: 'Last 30 days', days: 30 },
];

const dayLabel = (key: string) => fromDateKey(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function InsightsView() {
  const { habits } = useHabits();
  const today = useToday();
  const [habitId, setHabitId] = useState('all');
  const [rangeDays, setRangeDays] = useState(30);
  const [period, setPeriod] = useState(7);
  const [hover, setHover] = useState<number | null>(null);

  if (!today) return <div className="h-96 animate-pulse rounded-[1.85rem] bg-card" aria-busy="true" aria-label="Loading" />;

  if (habits.length === 0) {
    return (
      <Panel className="mx-auto mt-6 max-w-2xl border-dashed p-12 text-center">
        <p className="text-lg font-semibold">Insights appear once you track habits</p>
        <p className="mt-2 text-sm text-muted-foreground">Add a habit on the Today page, tick it off for a few days, and your trends will show up here.</p>
      </Panel>
    );
  }

  const selected = habits.filter((habit) => habitId === 'all' || habit.id === habitId);
  const from = addDays(today, -(rangeDays - 1));
  const overall = consistency(selected, from, today);

  const days = Array.from({ length: rangeDays }, (_, i) => addDays(from, i));
  const values = days.map((key) => dayProgress(selected, key));
  const plotted = values.flatMap((value, index) => (value === null ? [] : [{ index, value }]));
  const xOf = (index: number) => (rangeDays === 1 ? 0 : (index / (rangeDays - 1)) * 1200);
  const yOf = (value: number) => 300 - value * 2.8;
  const line = plotted.map((point, i) => `${i === 0 ? 'M' : 'L'}${xOf(point.index).toFixed(1)} ${yOf(point.value).toFixed(1)}`).join(' ');
  const area = plotted.length ? `${line} L${xOf(plotted[plotted.length - 1].index).toFixed(1)} 310 L${xOf(plotted[0].index).toFixed(1)} 310 Z` : '';
  const hovered = hover !== null && values[hover] !== null ? { index: hover, value: values[hover] as number } : null;

  const weekNow = consistency(selected, addDays(today, -6), today);
  const weekBefore = consistency(selected, addDays(today, -13), addDays(today, -7));
  const delta = weekNow - weekBefore;
  const bests = selected.map((habit) => ({ habit, streak: bestStreak(habit) })).sort((a, b) => streakInDays(b.habit, b.streak) - streakInDays(a.habit, a.streak));
  const best = bests[0];
  const ranked = habits.map((habit) => ({ habit, rate: consistency([habit], addDays(today, -29), today) })).sort((a, b) => a.rate - b.rate);
  const needsAttention = habits.length > 1 ? ranked[0].habit.name : '—';

  const leaderboard = habits
    .map((habit) => ({ habit, rate: consistency([habit], addDays(today, -(period - 1)), today) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 6);
  const streaks = habits
    .map((habit) => ({ habit, streak: currentStreak(habit, today) }))
    .sort((a, b) => streakInDays(b.habit, b.streak) - streakInDays(a.habit, a.streak))
    .slice(0, 6);
  const topStreak = Math.max(1, ...streaks.map((item) => streakInDays(item.habit, item.streak)));

  const cards = [
    { label: 'This week', value: `${weekNow}%` },
    { label: 'Vs last week', value: `${delta > 0 ? '+' : ''}${delta} pts`, tone: delta > 0 ? 'text-[var(--accent)]' : delta < 0 ? 'text-destructive' : '' },
    { label: 'Best streak', value: best && best.streak > 0 ? `🔥 ${formatStreak(best.habit, best.streak)}` : '🔥 0' },
    { label: 'Needs attention', value: needsAttention },
  ];

  return (
    <div className="mx-auto max-w-[1710px] space-y-5 pb-12">
      <Panel className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">{habitId === 'all' ? 'Overall consistency' : 'Consistency'}</p>
            <p className="mt-2 text-6xl font-semibold tracking-[-.06em]">{overall}%</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select label="Habit" value={habitId} onChange={setHabitId} width="min-w-44">
              <option value="all">Overall</option>
              {habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.name}</option>)}
            </Select>
            <Select label="Date range" value={String(rangeDays)} onChange={(value) => { setRangeDays(Number(value)); setHover(null); }} width="min-w-48">
              {RANGES.map((range) => <option key={range.days} value={range.days}>{range.label}</option>)}
            </Select>
          </div>
        </div>

        <div className="relative mt-8" onPointerLeave={() => setHover(null)} onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
          setHover(Math.round(ratio * (rangeDays - 1)));
        }}>
          <svg viewBox="0 0 1200 310" preserveAspectRatio="none" className="h-72 w-full" role="img" aria-label="Consistency over time">
            <defs><linearGradient id="insight-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity=".28" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
            {[20, 108, 196, 284].map((y) => <line key={y} x1="0" x2="1200" y1={y} y2={y} stroke="var(--border)" vectorEffect="non-scaling-stroke" />)}
            {area && <path d={area} fill="url(#insight-fill)" />}
            {line && <path d={line} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          </svg>
          {plotted.length === 1 && (
            <span className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]" style={{ left: `${(xOf(plotted[0].index) / 1200) * 100}%`, top: `${(yOf(plotted[0].value) / 310) * 288}px` }} />
          )}
          {hovered && (
            <>
              <div className="pointer-events-none absolute inset-y-0 w-px bg-[var(--accent)]/40" style={{ left: `${(xOf(hovered.index) / 1200) * 100}%` }} />
              <div className="pointer-events-none absolute -translate-x-1/2 rounded-2xl border border-border bg-card px-4 py-2 text-center shadow-xl" style={{ left: `clamp(48px, ${(xOf(hovered.index) / 1200) * 100}%, calc(100% - 48px))`, top: 0 }}>
                <p className="text-xs text-muted-foreground">{dayLabel(days[hovered.index])}</p>
                <p className="text-xl font-semibold text-[var(--accent)]">{hovered.value}%</p>
              </div>
            </>
          )}
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{dayLabel(days[0])}</span><span>{dayLabel(days[Math.floor(days.length / 2)])}</span><span>{dayLabel(days[days.length - 1])}</span></div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Panel key={card.label} className="grid min-h-28 place-items-center p-5 text-center">
            <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">{card.label}</p><p className={`mt-3 text-2xl font-semibold ${card.tone ?? ''}`}>{card.value}</p></div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Habit leaderboard</h2>
            <div className="flex rounded-full bg-[var(--surface-elevated)] p-1 text-xs" role="group" aria-label="Leaderboard period">
              {LEADERBOARD_PERIODS.map((item) => <button key={item.label} type="button" title={item.title} aria-pressed={period === item.days} onClick={() => setPeriod(item.days)} className={`rounded-full px-3 py-2 transition-colors ${period === item.days ? 'bg-card text-[var(--accent)]' : 'text-muted-foreground hover:text-foreground'}`}>{item.label}</button>)}
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {leaderboard.map(({ habit, rate }, index) => (
              <div key={habit.id}>
                <div className="mb-2 flex items-center gap-4"><Medal className={`size-4 ${index === 0 ? 'text-yellow-500' : 'text-slate-400'}`} /><strong className="flex-1 text-sm uppercase">{habit.name}</strong><span className="font-semibold text-[var(--accent)]">{rate}%</span></div>
                <div className="ml-8 h-3 overflow-hidden rounded-full bg-[var(--surface-elevated)]"><div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: habitColor(habit.color) }} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-8">
          <h2 className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Top streaks</h2>
          <div className="mt-8 space-y-6">
            {streaks.map(({ habit, streak }, index) => (
              <div key={habit.id}>
                <div className="mb-2 flex items-center gap-4"><Flame className={`size-4 ${index === 0 && streak > 0 ? 'text-orange-400' : 'text-slate-500'}`} /><strong className="flex-1 text-sm uppercase">{habit.name}</strong><span className="font-semibold text-[var(--accent)]">{streak}{isWeekly(habit) ? 'w' : 'd'}</span></div>
                <div className="ml-8 h-3 overflow-hidden rounded-full bg-[var(--surface-elevated)]"><div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(streakInDays(habit, streak) / topStreak) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, width, children }: { label: string; value: string; onChange: (value: string) => void; width: string; children: React.ReactNode }) {
  return (
    <label className={`relative flex h-12 items-center ${width}`}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-full w-full cursor-pointer appearance-none rounded-full border border-border bg-card pl-5 pr-11 text-sm font-semibold uppercase outline-none transition-colors hover:border-[var(--border-strong)] focus-visible:border-[var(--accent)]">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 size-4 text-muted-foreground" />
    </label>
  );
}
