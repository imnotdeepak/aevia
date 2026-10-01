'use client';

import { useRef, useState } from 'react';

import { hexToHsv, hsvToHex, normalizeHex } from '@/lib/theme';

const SIZE = 176;
const RADIUS = SIZE / 2;

type Props = {
  /** Current color as #rrggbb. */
  value: string;
  onChange: (hex: string) => void;
  label: string;
};

/**
 * A color wheel: angle picks the hue, distance from the center picks the saturation, and the slider
 * below sets the brightness. A hex field covers exact values and keyboard use.
 */
export function ColorWheel({ value, onChange, label }: Props) {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(value));
  const [seen, setSeen] = useState(value);
  const [draft, setDraft] = useState<string | null>(null);
  const wheel = useRef<HTMLDivElement>(null);

  // Follow outside changes (a preset, reset) without disturbing our own edits.
  if (value !== seen) {
    setSeen(value);
    setHsv(hexToHsv(value));
  }

  const [hue, saturation, brightness] = hsv;

  const emit = (next: [number, number, number]) => {
    const hex = hsvToHex(...next);
    setHsv(next);
    setSeen(hex);
    setDraft(null);
    onChange(hex);
  };

  const pick = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = wheel.current?.getBoundingClientRect();
    if (!box) return;
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const nextHue = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    const nextSaturation = Math.min(1, Math.hypot(dx, dy) / (box.width / 2));
    emit([nextHue, nextSaturation, brightness === 0 ? 1 : brightness]);
  };

  const angle = (hue * Math.PI) / 180;
  const markerX = RADIUS + saturation * RADIUS * Math.sin(angle);
  const markerY = RADIUS - saturation * RADIUS * Math.cos(angle);

  return (
    <div className="grid w-fit gap-4">
      <div
        ref={wheel}
        role="presentation"
        aria-label={`${label} color wheel`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pick(event);
        }}
        onPointerMove={(event) => event.buttons === 1 && pick(event)}
        className="relative cursor-crosshair touch-none rounded-full"
        style={{ width: SIZE, height: SIZE, background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle closest-side, #fff, rgba(255,255,255,0))' }} />
        {/* Dimmed by brightness, but never fully black, so the hues stay visible while choosing. */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-black" style={{ opacity: 1 - Math.max(brightness, 0.4) }} />
        <span
          className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
          style={{ left: markerX, top: markerY, background: value }}
        />
      </div>

      <label className="grid gap-1.5 text-xs text-muted-foreground">
        Brightness
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(brightness * 100)}
          aria-label={`${label} brightness`}
          onChange={(event) => emit([hue, saturation, Number(event.target.value) / 100])}
          className="h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
          style={{ background: `linear-gradient(90deg, #000, ${hsvToHex(hue, saturation, 1)})` }}
        />
      </label>

      <label className="grid gap-1.5 text-xs text-muted-foreground">
        Hex
        <input
          value={draft ?? value}
          maxLength={7}
          spellCheck={false}
          aria-label={`${label} hex value`}
          onChange={(event) => {
            const text = event.target.value.startsWith('#') ? event.target.value : `#${event.target.value}`;
            setDraft(text);
            const hex = normalizeHex(text);
            if (hex) {
              setHsv(hexToHsv(hex));
              setSeen(hex);
              onChange(hex);
            }
          }}
          onBlur={() => setDraft(null)}
          className="h-10 w-32 rounded-xl border border-border bg-background px-3 font-mono text-sm uppercase text-foreground outline-none focus:border-[var(--accent)]"
        />
      </label>
    </div>
  );
}
