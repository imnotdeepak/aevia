'use client';

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Copy, Plus, X } from 'lucide-react';

import { createTasks } from '@/app/app/task-actions';
import { Panel, ProgressRing } from '@/components/dashboard-visuals';
import { useTasks } from '@/components/app-data';
import { useTaskActions } from '@/components/tasks/use-task-actions';
import { useToday } from '@/components/habits/use-habits';
import { addDays, fromDateKey } from '@/lib/habit-utils';

const percent = (done: number, total: number) => (total === 0 ? 0 : Math.round((done / total) * 100));
const shortDate = (key: string) => fromDateKey(key).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

export function TasksView() {
  const today = useToday();
  const { items: tasks, error, clearError, run } = useTasks();
  const { toggleTask, removeTask } = useTaskActions();
  const [weekOffset, setWeekOffset] = useState(0);

  if (!today) return <div className="h-96 animate-pulse rounded-[1.85rem] bg-card" aria-busy="true" aria-label="Loading" />;

  const thisWeekStart = addDays(today, -fromDateKey(today).getDay());
  const weekStart = addDays(thisWeekStart, weekOffset * 7);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map(week.map((key) => [key, tasks.filter((item) => item.date === key)]));
  const weekTasks = week.flatMap((key) => byDay.get(key) ?? []);
  const weekDone = weekTasks.filter((item) => item.done).length;

  const add = (date: string, titles: string[]) => {
    const entries = titles.map((title) => ({ title: title.trim(), date })).filter((entry) => entry.title);
    if (entries.length === 0) return;
    const optimistic = entries.map((entry) => ({ id: `tmp-${crypto.randomUUID()}`, ...entry, done: false }));
    run({ type: 'add', tasks: optimistic }, () => createTasks(entries));
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <Panel className="p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">{weekOffset === 0 ? 'This week' : 'Week starting'}</p>
              <p className="mt-3 rounded-full bg-[var(--accent)] px-5 py-2 text-lg font-semibold text-[var(--accent-foreground)]">{shortDate(week[0])} – {shortDate(week[6])} {fromDateKey(week[6]).getFullYear()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setWeekOffset((value) => value - 1)} className="grid size-12 place-items-center rounded-full border border-border transition-colors hover:border-[var(--border-strong)]" aria-label="Previous week"><ChevronLeft /></button>
              <button type="button" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0} className="h-12 rounded-full border border-border px-5 font-medium transition-colors enabled:hover:border-[var(--border-strong)] disabled:opacity-40">This week</button>
              <button type="button" onClick={() => setWeekOffset((value) => value + 1)} className="grid size-12 place-items-center rounded-full border border-border transition-colors hover:border-[var(--border-strong)]" aria-label="Next week"><ChevronRight /></button>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-end gap-7">
            <div className="grid min-w-64 flex-1 grid-cols-7 items-end gap-3 sm:gap-5">
              {week.map((key) => {
                const list = byDay.get(key) ?? [];
                const value = percent(list.filter((item) => item.done).length, list.length);
                return (
                  <div key={key} className="text-center">
                    <div className="mx-auto flex h-28 w-9 items-end overflow-hidden rounded-2xl bg-[var(--surface-elevated)] sm:w-11"><span className="w-full rounded-2xl bg-[var(--accent)] transition-all" style={{ height: `${value}%` }} /></div>
                    <p className={`mt-3 text-xs ${key === today ? 'font-semibold text-[var(--accent)]' : 'text-muted-foreground'}`}>{fromDateKey(key).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                  </div>
                );
              })}
            </div>
            <div className="text-center"><ProgressRing value={percent(weekDone, weekTasks.length)} size={140} /><p className="mt-3 text-sm text-muted-foreground">{weekDone} / {weekTasks.length} completed</p></div>
          </div>
        </Panel>

        <Panel className="p-7">
          <h2 className="text-sm font-semibold uppercase tracking-[.12em] text-muted-foreground">Up next</h2>
          {(() => {
            const open = tasks.filter((item) => !item.done && item.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
            if (open.length === 0) return <p className="mt-6 text-sm text-muted-foreground">Nothing coming up. Add a task to any day below.</p>;
            return (
              <ul className="mt-5 space-y-2">
                {open.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-[var(--surface-elevated)] px-4 py-3 text-sm">
                    <span className="flex-1">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.date === today ? 'Today' : shortDate(item.date)}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </Panel>
      </div>

      {error && (
        <p role="alert" className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
          <button type="button" onClick={clearError} className="underline">Dismiss</button>
        </p>
      )}

      <div className="pb-2 lg:overflow-x-auto">
        <div className="grid gap-3 md:grid-cols-2 lg:min-w-[1180px] lg:grid-cols-7">
          {week.map((key) => {
            const list = byDay.get(key) ?? [];
            const done = list.filter((item) => item.done).length;
            const previous = tasks.filter((item) => item.date === addDays(key, -1));
            return (
              <Panel key={key} className={`lg:min-h-[420px] p-4 ${key === today ? 'border-[color:var(--accent)]/60 bg-[var(--accent-soft)]/30' : ''}`}>
                <div className="text-center">
                  <h2 className="text-lg font-semibold">{fromDateKey(key).toLocaleDateString(undefined, { weekday: 'long' })}</h2>
                  <p className="text-sm text-muted-foreground">{shortDate(key)}</p>
                  <div className="mt-4 flex justify-center"><ProgressRing value={percent(done, list.length)} size={88} /></div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">{list.length === 0 ? 'No tasks' : `${done}/${list.length} done`}</p>
                </div>
                <ul className="mt-3 space-y-2">
                  {list.map((item) => (
                    <li key={item.id} className="group flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--surface-elevated)] pl-3 pr-1">
                      <button type="button" role="checkbox" aria-checked={item.done} aria-label={item.title} disabled={item.id.startsWith('tmp-')} onClick={() => toggleTask(item)} className={`grid size-6 shrink-0 place-items-center rounded-md border transition-colors ${item.done ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 'border-[var(--border-strong)]'}`}>{item.done && <Check className="size-4" />}</button>
                      <span className={`flex-1 py-2 text-sm break-words ${item.done ? 'text-muted-foreground line-through' : ''}`}>{item.title}</span>
                      <button type="button" aria-label={`Delete ${item.title}`} disabled={item.id.startsWith('tmp-')} onClick={() => removeTask(item)} className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"><X className="size-4" /></button>
                    </li>
                  ))}
                </ul>
                <AddTask onAdd={(title) => add(key, [title])} />
                {list.length === 0 && previous.length > 0 && (
                  <button type="button" onClick={() => add(key, previous.map((item) => item.title))} className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"><Copy className="size-3" />Copy yesterday&apos;s list</button>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="mt-2 flex h-11 items-center gap-2 rounded-2xl border border-dashed border-border px-3 text-sm focus-within:border-[var(--accent)]"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(value);
        setValue('');
      }}
    >
      <Plus className="size-4 shrink-0 text-muted-foreground" />
      <input value={value} onChange={(event) => setValue(event.target.value)} maxLength={120} placeholder="Add task" aria-label="Add task" className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground" />
    </form>
  );
}
