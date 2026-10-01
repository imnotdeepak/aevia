'use client';

import { useSyncExternalStore } from 'react';
import { ThinkingOrb } from 'thinking-orbs';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/**
 * The small spinning orb shown inside a button while something loads. The library draws on a canvas and
 * has no "use client" marker of its own, so it lives behind this client component and can be used from
 * server-rendered pages too.
 */
export function LoadingOrb({ size = 32 }: { size?: 20 | 32 | 64 }) {
  // People who ask their system for less motion get the orb frozen on a single frame.
  const reduceMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );

  // "light" draws dark dots, which read on the yellow accent buttons used for sign-in and sign-up.
  return <ThinkingOrb state="working" size={size} theme="light" paused={reduceMotion} aria-hidden />;
}
