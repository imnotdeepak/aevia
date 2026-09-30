'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Flame, Snowflake } from 'lucide-react';

const initialHabits = [
  { id: 1, name: 'Wake up early', streak: 6, done: true },
  { id: 2, name: 'Meditate', streak: 3, done: true },
  { id: 3, name: 'Exercise', streak: 4, done: false },
  { id: 4, name: 'Read 10 pages', streak: 8, done: true },
  { id: 5, name: 'Plan tomorrow', streak: 2, done: false },
  { id: 6, name: 'Journal', streak: 5, done: true },
];

export default function TodayPage() {
  const [habits, setHabits] = useState(initialHabits);
  const completed = habits.filter((habit) => habit.done).length;
  const percentage = useMemo(() => Math.round((completed / habits.length) * 100), [completed, habits.length]);

  useEffect(() => {
    const modelContext = (document as Document & {
      modelContext?: {
        registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void>;
      };
    }).modelContext;

    if (!modelContext?.registerTool) return;

    const lifecycle = new AbortController();

    void Promise.resolve(modelContext.registerTool({
      name: 'set_habit_completion',
      title: 'Set habit completion',
      description: 'Mark one visible Today habit as completed or pending.',
      inputSchema: {
        type: 'object',
        properties: {
          habitId: { type: 'number', enum: initialHabits.map((habit) => habit.id) },
          completed: { type: 'boolean' },
        },
        required: ['habitId', 'completed'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const value = input as { habitId?: unknown; completed?: unknown };
        if (typeof value.habitId !== 'number' || typeof value.completed !== 'boolean' || !initialHabits.some((habit) => habit.id === value.habitId)) {
          throw new Error('Provide a valid habitId and completed state.');
        }

        setHabits((items) => items.map((item) => item.id === value.habitId ? { ...item, done: value.completed as boolean } : item));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        return { habitId: value.habitId, completed: value.completed };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  return (
    <section className="mx-auto max-w-5xl py-8 sm:py-14">
      <div className="flex flex-col items-center text-center">
        <div className="grid size-44 place-items-center rounded-full transition-all duration-300" style={{ background: `conic-gradient(var(--accent) 0 ${percentage}%, var(--surface-elevated) ${percentage}% 100%)` }} aria-label={`${percentage}% complete today`}>
          <div className="grid size-36 place-items-center rounded-full bg-background"><div><p className="text-4xl font-semibold tracking-[-0.04em]">{percentage}%</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Today</p></div></div>
        </div>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tuesday · September 30</p>
        <p className="mt-2 text-lg">{completed} of {habits.length} completed</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Snowflake className="size-4 text-[var(--accent)]" />3 freeze tokens available</p>
      </div>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        {habits.map((habit) => (
          <button key={habit.id} type="button" aria-pressed={habit.done} onClick={() => setHabits((items) => items.map((item) => item.id === habit.id ? { ...item, done: !item.done } : item))} className={`group flex min-h-20 items-center gap-4 rounded-3xl border px-5 text-left transition-all ${habit.done ? 'border-[color:var(--accent)]/30 bg-[var(--accent-soft)]' : 'border-border bg-card hover:border-[var(--border-strong)]'}`}>
            <span className={`grid size-9 place-items-center rounded-full border transition-all ${habit.done ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 'border-[var(--border-strong)]'}`}>{habit.done && <Check className="size-5" strokeWidth={3} />}</span>
            <span className="flex-1 font-medium">{habit.name}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground"><Flame className="size-4 text-orange-400" />{habit.streak}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
