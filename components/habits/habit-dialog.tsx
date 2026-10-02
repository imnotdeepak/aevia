'use client';

import { useState } from 'react';
import { Check, Minus, Plus, Trash2 } from 'lucide-react';

import type { HabitInput } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ACCENT_COLOR, ALL_DAYS, HABIT_COLORS, TIMES_OF_DAY, WEEKDAY_NAMES, WEEKDAYS, habitColor, habitInk, normalizeDays, normalizeHabitColor, type TimeOfDay } from '@/lib/habit-utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing habit. */
  initial?: HabitInput;
  onSubmit: (input: HabitInput) => void;
  onDelete?: () => void;
};

const PRESETS = [
  { label: 'Every day', days: ALL_DAYS },
  { label: 'Weekdays', days: '12345' },
  { label: 'Weekends', days: '06' },
];

export function HabitDialog({ open, onOpenChange, initial, onSubmit, onDelete }: Props) {
  const close = () => onOpenChange(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <HabitForm
          initial={initial}
          onSubmit={(value) => {
            onSubmit(value);
            close();
          }}
          onDelete={
            onDelete &&
            (() => {
              onDelete();
              close();
            })
          }
        />
      </DialogContent>
    </Dialog>
  );
}

function HabitForm({ initial, onSubmit, onDelete }: Pick<Props, 'initial' | 'onSubmit' | 'onDelete'>) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(normalizeHabitColor(initial?.color ?? HABIT_COLORS[0]));
  const [days, setDays] = useState(initial?.days ?? ALL_DAYS);
  const [weekly, setWeekly] = useState(initial?.weeklyTarget != null);
  const [target, setTarget] = useState(initial?.weeklyTarget ?? 3);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(initial?.timeOfDay ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleDay = (day: number) => {
    const key = String(day);
    setDays((current) => normalizeDays(current.includes(key) ? current.replace(key, '') : current + key));
  };

  // A weekly target can never exceed the number of days it can be done on.
  const effectiveTarget = Math.min(Math.max(target, 1), Math.max(days.length, 1));
  const valid = name.trim().length > 0 && days.length > 0;

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSubmit({ name, color, days, weeklyTarget: weekly ? effectiveTarget : null, timeOfDay });
      }}
    >
      <DialogHeader>
        <DialogTitle>{initial ? 'Edit habit' : 'New habit'}</DialogTitle>
        <DialogDescription>{initial ? 'Change how this habit looks and when it repeats.' : 'Anything you want to do consistently.'}</DialogDescription>
      </DialogHeader>

      <label className="grid gap-2 text-sm font-medium">
        Name
        <input
          // oxlint-disable-next-line jsx-a11y/no-autofocus -- the dialog opens for typing a name, so focusing it helps
          autoFocus
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Read 10 pages"
          className="h-11 rounded-xl border border-border bg-background px-3.5 text-base outline-none focus:border-[var(--accent)]"
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">How often</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-elevated)] p-1" role="group" aria-label="How often">
          {[{ weekly: false, label: 'On set days' }, { weekly: true, label: 'Times a week' }].map((option) => (
            <button key={option.label} type="button" aria-pressed={weekly === option.weekly} onClick={() => setWeekly(option.weekly)} className={`h-9 rounded-lg text-sm font-medium transition-colors ${weekly === option.weekly ? 'bg-card text-[var(--accent)] shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {option.label}
            </button>
          ))}
        </div>
        {weekly && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
            <span className="text-sm">Do it <strong>{effectiveTarget}</strong> {effectiveTarget === 1 ? 'time' : 'times'} a week, on any of the days below</span>
            <span className="flex items-center gap-1">
              <button type="button" aria-label="Fewer times a week" disabled={effectiveTarget <= 1} onClick={() => setTarget(effectiveTarget - 1)} className="grid size-8 place-items-center rounded-full border border-border transition-colors enabled:hover:border-[var(--accent)] disabled:opacity-40"><Minus className="size-4" /></button>
              <button type="button" aria-label="More times a week" disabled={effectiveTarget >= days.length} onClick={() => setTarget(effectiveTarget + 1)} className="grid size-8 place-items-center rounded-full border border-border transition-colors enabled:hover:border-[var(--accent)] disabled:opacity-40"><Plus className="size-4" /></button>
            </span>
          </div>
        )}
        <p className="mt-2 text-sm font-medium">{weekly ? 'Available days' : 'Repeats on'}</p>
        <div className="flex gap-1.5">
          {WEEKDAYS.map((label, day) => {
            const on = days.includes(String(day));
            return (
              <button key={day} type="button" aria-pressed={on} aria-label={WEEKDAY_NAMES[day]} onClick={() => toggleDay(day)} className={`grid size-10 place-items-center rounded-full border text-sm font-semibold transition-colors ${on ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]' : 'border-border text-muted-foreground hover:border-[var(--border-strong)]'}`}>
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-1 flex gap-2">
          {PRESETS.map((preset) => (
            <button key={preset.label} type="button" onClick={() => setDays(preset.days)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Time of day</legend>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-[var(--surface-elevated)] p-1" role="group" aria-label="Time of day">
          {[{ id: null, label: 'Anytime' }, ...TIMES_OF_DAY].map((option) => (
            <button key={option.label} type="button" aria-pressed={timeOfDay === option.id} onClick={() => setTimeOfDay(option.id)} className={`h-9 rounded-lg text-xs font-medium transition-colors sm:text-sm ${timeOfDay === option.id ? 'bg-card text-[var(--accent)] shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Color</legend>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((value) => (
            <button key={value} type="button" aria-label={value === ACCENT_COLOR ? 'Match accent color' : `Color ${value}`} title={value === ACCENT_COLOR ? 'Matches your accent color' : undefined} aria-pressed={color === value} onClick={() => setColor(value)} className={`grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-popover transition-shadow ${color === value ? 'ring-2 ring-foreground' : ''}`} style={{ background: habitColor(value) }}>
              {color === value && <Check className="size-4" style={{ color: habitInk(value) }} strokeWidth={3} />}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3 pt-1">
        {onDelete ? (
          confirmDelete ? (
            <Button type="button" variant="destructive" onClick={onDelete}>Delete forever</Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}><Trash2 />Delete</Button>
          )
        ) : (
          <span />
        )}
        <Button type="submit" disabled={!valid} className="h-10 bg-[var(--accent)] px-5 text-[var(--accent-foreground)] hover:bg-[var(--accent)]/90">
          {initial ? 'Save changes' : 'Add habit'}
        </Button>
      </div>
      {confirmDelete && <p className="-mt-2 text-xs text-muted-foreground">This removes the habit and its history. You will have a few seconds to undo it.</p>}
    </form>
  );
}
