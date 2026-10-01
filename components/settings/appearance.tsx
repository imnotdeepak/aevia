'use client';

import { useState } from 'react';
import { Check, RotateCcw, TriangleAlert } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import { ColorWheel } from '@/components/ui/color-wheel';
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND,
  DEFAULT_FOREGROUND,
  TEXT_PRESETS,
  contrastRatio,
  effectiveColors,
  readableOn,
} from '@/lib/theme';

type Preset = { name: string; hex: string | null };

export function AppearanceSettings() {
  const { theme, update, reset, error } = useTheme();
  const colors = effectiveColors(theme);
  const unchanged = !theme.accent && !theme.background && !theme.foreground;

  const textContrast = contrastRatio(colors.foreground, colors.background);
  const accentContrast = contrastRatio(colors.accent, colors.background);

  return (
    <section className="rounded-[2rem] border border-border bg-card p-8 sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Appearance</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Make it yours</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">Pick a preset or open the color wheel for any color you like. Changes apply right away and are saved to your account.</p>
        </div>
        <button type="button" onClick={reset} disabled={unchanged} className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors enabled:hover:border-[var(--border-strong)] disabled:opacity-40">
          <RotateCcw className="size-4" />Reset to defaults
        </button>
      </div>

      <div className="mt-8 grid gap-10">
        <ColorField title="Accent color" hint="Buttons, rings, streaks and highlights." presets={ACCENT_PRESETS} value={theme.accent} fallback={DEFAULT_ACCENT} onChange={(hex) => update({ accent: hex })} />
        <ColorField title="Background color" hint="The page behind everything. Cards and borders adjust to match." presets={BACKGROUND_PRESETS} value={theme.background} fallback={DEFAULT_BACKGROUND} onChange={(hex) => update({ background: hex })} />
        <ColorField title="Text color" hint="Headings and body text. Muted text is derived from it." presets={TEXT_PRESETS} value={theme.foreground} fallback={DEFAULT_FOREGROUND} onChange={(hex) => update({ foreground: hex })} />
      </div>

      {(textContrast < 4.5 || accentContrast < 3) && (
        <div role="status" className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <p>
            {textContrast < 4.5 && <>Your text and background colors are close together, so text may be hard to read. </>}
            {accentContrast < 3 && <>Your accent color blends into the background, so highlights may be hard to see.</>}
          </p>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </section>
  );
}

function ColorField({ title, hint, presets, value, fallback, onChange }: { title: string; hint: string; presets: Preset[]; value: string | null; fallback: string; onChange: (hex: string | null) => void }) {
  const isPreset = presets.some((preset) => preset.hex === value);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3" role="radiogroup" aria-label={title}>
        {presets.map((preset) => {
          const selected = preset.hex === value;
          const shown = preset.hex ?? fallback;
          return (
            <button
              key={preset.name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={preset.name}
              title={preset.name}
              onClick={() => {
                onChange(preset.hex);
                setOpen(false);
              }}
              className={`grid size-11 place-items-center rounded-full border outline-offset-4 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${selected ? 'border-foreground' : 'border-[var(--border-strong)]'}`}
              style={{ background: shown }}
            >
              {selected && <Check className="size-5" style={{ color: readableOn(shown) }} strokeWidth={3} />}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={!isPreset}
          aria-label="Custom color"
          title="Custom color"
          onClick={() => setOpen((current) => !current)}
          className={`grid size-11 place-items-center rounded-full border outline-offset-4 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${!isPreset ? 'border-foreground' : 'border-[var(--border-strong)]'}`}
          style={{ background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
        >
          {!isPreset && value && <span className="size-5 rounded-full border-2 border-white" style={{ background: value }} />}
        </button>
      </div>
      {open && (
        <div className="mt-5 rounded-2xl border border-border bg-[var(--surface-elevated)] p-5">
          <ColorWheel label={title} value={value ?? fallback} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
