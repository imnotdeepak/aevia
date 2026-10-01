export const TIMES_OF_DAY = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
] as const;

export type TimeOfDay = (typeof TIMES_OF_DAY)[number]['id'];

export const isTimeOfDay = (value: unknown): value is TimeOfDay => TIMES_OF_DAY.some((time) => time.id === value);

export type HabitData = {
  id: string;
  name: string;
  color: string;
  /** Weekday digits the habit can be done on, 0 = Sunday. */
  days: string;
  /** When set, the habit needs this many completions per week (on any of `days`) instead of every day in `days`. */
  weeklyTarget: number | null;
  /** Part of the day the habit belongs to, or null for any time. */
  timeOfDay: TimeOfDay | null;
  /** First date the habit counts toward stats, YYYY-MM-DD. */
  since: string;
  /** Completed local dates, YYYY-MM-DD. */
  completed: string[];
  /** Missed days protected by a freeze token, YYYY-MM-DD. */
  frozen: string[];
};

/** Habit color that follows the user's accent color instead of being a fixed hex. */
export const ACCENT_COLOR = 'accent';
export const HABIT_COLORS = [ACCENT_COLOR, '#fb923c', '#f87171', '#f472b6', '#a78bfa', '#60a5fa', '#2dd4bf', '#4ade80'];
/** Habits created before accent matching existed were saved with this yellow as their default. */
const LEGACY_DEFAULT_COLOR = '#facc15';

/** Maps stored colors onto the current choices: the old default yellow now means "match the accent". */
export const normalizeHabitColor = (color: string) => (color === LEGACY_DEFAULT_COLOR ? ACCENT_COLOR : color);

/** The CSS color to draw a habit with. Accent-matching habits follow the theme. */
export const habitColor = (color: string) => (normalizeHabitColor(color) === ACCENT_COLOR ? 'var(--accent)' : color);

/** Readable color for a check mark drawn on top of the habit's color. */
export const habitInk = (color: string) => (normalizeHabitColor(color) === ACCENT_COLOR ? 'var(--accent-foreground)' : '#000');

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const ALL_DAYS = '0123456';

/** Most freeze tokens that can be held at once. */
export const MAX_FREEZES = 3;
/** A finished week at or above this consistency earns a freeze token. */
export const STRONG_WEEK_PERCENT = 80;
/** How far back a missed day can still be frozen. */
export const FREEZE_WINDOW_DAYS = 14;

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: string, amount: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

/** The Sunday that starts the week containing the given date. */
export function weekStart(key: string) {
  return addDays(key, -fromDateKey(key).getDay());
}

export function isScheduled(habit: Pick<HabitData, 'days'>, key: string) {
  return habit.days.includes(String(fromDateKey(key).getDay()));
}

export function normalizeDays(days: string) {
  const unique = Array.from(new Set(days.split('').filter((char) => /[0-6]/.test(char)))).sort();
  return unique.join('');
}

export const isWeekly = (habit: Pick<HabitData, 'weeklyTarget'>) => habit.weeklyTarget !== null;

/** Completions in the week (Sunday to Saturday) containing the given date. */
export function weekCount(habit: HabitData, key: string) {
  const done = new Set(habit.completed);
  const start = weekStart(key);
  let count = 0;
  for (let i = 0; i < 7; i++) if (done.has(addDays(start, i))) count++;
  return count;
}

export type HabitState = 'done' | 'frozen' | 'todo' | 'resting';

/** What a habit looks like on a given day: ticked, frozen, still to do, or nothing to do. */
export function habitState(habit: HabitData, key: string): HabitState {
  if (habit.completed.includes(key)) return 'done';
  if (habit.frozen.includes(key)) return 'frozen';
  if (!isScheduled(habit, key)) return 'resting';
  if (habit.weeklyTarget !== null && weekCount(habit, key) >= habit.weeklyTarget) return 'resting';
  return 'todo';
}

/** Streak length unit: days for daily and set-day habits, weeks for "N times a week" habits. */
export const streakUnit = (habit: Pick<HabitData, 'weeklyTarget'>) => (isWeekly(habit) ? 'week' : 'day');

/** A streak expressed in days, so streaks in different units can be compared. */
export const streakInDays = (habit: Pick<HabitData, 'weeklyTarget'>, streak: number) => (isWeekly(habit) ? streak * 7 : streak);

export function formatStreak(habit: Pick<HabitData, 'weeklyTarget'>, streak: number) {
  const unit = streakUnit(habit);
  return `${streak} ${unit}${streak === 1 ? '' : 's'}`;
}

/** Current streak: consecutive scheduled days (or weeks hitting the target) completed, ending now. */
export function currentStreak(habit: HabitData, today: string) {
  const done = new Set(habit.completed);

  if (habit.weeklyTarget !== null) {
    const target = habit.weeklyTarget;
    let start = weekStart(today);
    let streak = weekCount(habit, start) >= target ? 1 : 0;
    // The current week may still be in progress, so it only adds to the streak, never breaks it.
    for (let i = 0; i < 53; i++) {
      start = addDays(start, -7);
      if (addDays(start, 6) < habit.since || weekCount(habit, start) < target) break;
      streak++;
    }
    return streak;
  }

  const frozen = new Set(habit.frozen);
  let streak = 0;
  let cursor = today;
  // Walk back at most a year; a pending today does not break the streak and frozen days are skipped.
  for (let i = 0; i < 366; i++) {
    if (isScheduled(habit, cursor)) {
      if (done.has(cursor)) streak++;
      else if (frozen.has(cursor)) {
        // protected: neither counts nor breaks
      } else if (cursor !== today) break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStreak(habit: HabitData) {
  const dates = [...habit.completed].sort();
  if (dates.length === 0) return 0;
  const last = dates[dates.length - 1];
  let best = 0;
  let run = 0;

  if (habit.weeklyTarget !== null) {
    for (let start = weekStart(dates[0]); start <= last; start = addDays(start, 7)) {
      if (weekCount(habit, start) >= habit.weeklyTarget) {
        run++;
        best = Math.max(best, run);
      } else run = 0;
    }
    return best;
  }

  const done = new Set(dates);
  const frozen = new Set(habit.frozen);
  for (let cursor = dates[0]; cursor <= last; cursor = addDays(cursor, 1)) {
    if (!isScheduled(habit, cursor)) continue;
    if (done.has(cursor)) {
      run++;
      best = Math.max(best, run);
    } else if (!frozen.has(cursor)) run = 0;
  }
  return best;
}

/** Scheduled vs completed habit-days across a date range, inclusive. Frozen days are left out. */
function tally(habits: HabitData[], from: string, to: string) {
  let scheduled = 0;
  let completed = 0;

  for (const habit of habits) {
    const done = new Set(habit.completed);

    if (habit.weeklyTarget !== null) {
      const target = habit.weeklyTarget;
      for (let start = weekStart(from); start <= to; start = addDays(start, 7)) {
        const end = addDays(start, 6);
        if (end < habit.since) continue;
        const count = weekCount(habit, start);
        // A week still in progress is never penalised: it only counts what is already done.
        scheduled += end <= to ? target : count;
        completed += Math.min(count, target);
      }
      continue;
    }

    const frozen = new Set(habit.frozen);
    for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
      if (cursor < habit.since || !isScheduled(habit, cursor)) continue;
      if (frozen.has(cursor) && !done.has(cursor)) continue;
      scheduled++;
      if (done.has(cursor)) completed++;
    }
  }

  return { scheduled, completed };
}

/** Share (0-100) of scheduled habit-days completed across a date range, inclusive. */
export function consistency(habits: HabitData[], from: string, to: string) {
  const { scheduled, completed } = tally(habits, from, to);
  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
}

/** Completion share (0-100) for one day, or null when nothing needed doing. */
export function dayProgress(habits: HabitData[], key: string) {
  let total = 0;
  let done = 0;
  for (const habit of habits) {
    if (key < habit.since) continue;
    const state = habitState(habit, key);
    if (state === 'todo' || state === 'done') total++;
    if (state === 'done') done++;
  }
  return total === 0 ? null : Math.round((done / total) * 100);
}

export type FreezeTokens = {
  /** Tokens ready to use right now. */
  available: number;
  /** Freezes already spent. */
  used: number;
  /** False when the freezes on record would spend more tokens than were ever earned. */
  valid: boolean;
};

/**
 * Freeze tokens are earned, one per finished week at or above STRONG_WEEK_PERCENT, up to MAX_FREEZES at a
 * time, and spent when a missed day is frozen. The balance is replayed from the habit history.
 */
export function freezeTokens(habits: HabitData[], today: string): FreezeTokens {
  const events: { date: string; delta: 1 | -1 }[] = [];
  let used = 0;

  if (habits.length > 0) {
    const first = habits.reduce((min, habit) => (habit.since < min ? habit.since : min), habits[0].since);
    for (let start = weekStart(first); addDays(start, 6) < today; start = addDays(start, 7)) {
      const end = addDays(start, 6);
      const { scheduled, completed } = tally(habits, start, end);
      if (scheduled > 0 && (completed / scheduled) * 100 >= STRONG_WEEK_PERCENT) events.push({ date: end, delta: 1 });
    }
    for (const habit of habits) {
      for (const date of habit.frozen) {
        events.push({ date, delta: -1 });
        used++;
      }
    }
  }

  // Tokens earned on a date are available to spend on that same date.
  events.sort((a, b) => (a.date === b.date ? b.delta - a.delta : a.date < b.date ? -1 : 1));
  let balance = 0;
  let valid = true;
  for (const event of events) {
    balance = Math.min(MAX_FREEZES, balance + event.delta);
    if (balance < 0) {
      valid = false;
      balance = 0;
    }
  }
  return { available: balance, used, valid };
}
