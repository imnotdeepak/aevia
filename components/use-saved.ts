'use client';

import { useCallback, useOptimistic, useState, useTransition } from 'react';

/**
 * Server-provided list with instant optimistic changes. `run` applies a change on screen
 * immediately and runs the save in the background; the list resyncs when the server revalidates.
 */
export function useSaved<T, C>(initial: T[], reducer: (items: T[], change: C) => T[]) {
  const [items, apply] = useOptimistic(initial, reducer);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    (change: C | null, save: () => Promise<void>) => {
      setError(null);
      startTransition(async () => {
        if (change) apply(change);
        try {
          await save();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
        }
      });
    },
    [apply],
  );

  return { items, error, clearError: () => setError(null), run };
}
