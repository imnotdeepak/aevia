'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type Entry = { id: number; message: string; undo: () => void };

const Context = createContext<{ notify: (message: string, undo: () => void) => void } | null>(null);

const VISIBLE_MS = 7000;

/** Shows a short "Undo" message after an action, for actions that are easy to do by accident. */
export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const counter = useRef(0);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setEntry(null);
  }, []);

  const notify = useCallback((message: string, undo: () => void) => {
    clearTimeout(timer.current);
    counter.current += 1;
    setEntry({ id: counter.current, message, undo });
    timer.current = setTimeout(() => setEntry(null), VISIBLE_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Context value={{ notify }}>
      {children}
      {entry && (
        <div
          key={entry.id}
          role="status"
          aria-live="polite"
          // Sits above the phone navigation bar, and in the corner-free center on wider screens.
          className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-popover px-4 py-3 text-sm shadow-xl md:bottom-6"
        >
          <span className="min-w-0 flex-1 truncate">{entry.message}</span>
          <button
            type="button"
            onClick={() => {
              entry.undo();
              dismiss();
            }}
            className="shrink-0 font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Undo
          </button>
          <button type="button" aria-label="Dismiss" onClick={dismiss} className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      )}
    </Context>
  );
}

export function useUndo() {
  const value = useContext(Context);
  if (!value) throw new Error('useUndo must be used inside UndoProvider.');
  return value.notify;
}
