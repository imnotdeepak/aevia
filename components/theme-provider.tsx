'use client';

import { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react';

import { saveTheme } from '@/app/app/actions';
import { DEFAULT_THEME, themeCss, type ThemeSettings } from '@/lib/theme';

type ThemeContext = {
  theme: ThemeSettings;
  /** Change one or more colors. The page updates instantly and the change is saved shortly after. */
  update: (changes: Partial<ThemeSettings>) => void;
  reset: () => void;
  error: string | null;
};

const Context = createContext<ThemeContext | null>(null);

/**
 * Applies the user's chosen colors to the dashboard. The style tag lives in the dashboard layout, so
 * it disappears again when the user leaves for the landing or sign-in pages.
 */
export function ThemeProvider({ initial, children }: { initial: ThemeSettings; children: React.ReactNode }) {
  const [theme, setTheme] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(theme);
  const pending = useRef(false);

  const persist = (next: ThemeSettings) => {
    latest.current = next;
    pending.current = true;
    clearTimeout(timer.current);
    // Dragging across a color wheel changes the color many times a second; save once it settles.
    timer.current = setTimeout(() => {
      pending.current = false;
      startTransition(async () => {
        try {
          setError(null);
          await saveTheme(latest.current);
        } catch {
          setError('Could not save your colors. They will reset when you reload.');
        }
      });
    }, 500);
  };

  // Save a change that is still waiting if the user leaves the dashboard right away.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (pending.current) void saveTheme(latest.current).catch(() => undefined);
    },
    [],
  );

  const update = (changes: Partial<ThemeSettings>) => {
    const next = { ...latest.current, ...changes };
    setTheme(next);
    persist(next);
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
    persist(DEFAULT_THEME);
  };

  const css = themeCss(theme);
  return (
    <Context value={{ theme, update, reset, error }}>
      {css && <style>{css}</style>}
      {children}
    </Context>
  );
}

export function useTheme() {
  const value = useContext(Context);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}
