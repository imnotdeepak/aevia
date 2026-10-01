export type ThemeSettings = {
  /** Hex colors (#rrggbb). Null means the app default. */
  accent: string | null;
  background: string | null;
  foreground: string | null;
};

export const DEFAULT_THEME: ThemeSettings = { accent: null, background: null, foreground: null };

export const ACCENT_PRESETS: { name: string; hex: string | null }[] = [
  { name: 'Yellow', hex: null },
  { name: 'Orange', hex: '#fb923c' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Rose', hex: '#f472b6' },
  { name: 'Violet', hex: '#a78bfa' },
  { name: 'Blue', hex: '#60a5fa' },
  { name: 'Teal', hex: '#2dd4bf' },
  { name: 'Green', hex: '#4ade80' },
];

export const BACKGROUND_PRESETS: { name: string; hex: string | null }[] = [
  { name: 'Default', hex: null },
  { name: 'Black', hex: '#000000' },
  { name: 'Charcoal', hex: '#18181b' },
  { name: 'Navy', hex: '#0b1220' },
  { name: 'Forest', hex: '#0c1410' },
  { name: 'Plum', hex: '#150f1a' },
  { name: 'Paper', hex: '#faf7f2' },
  { name: 'White', hex: '#ffffff' },
];

export const TEXT_PRESETS: { name: string; hex: string | null }[] = [
  { name: 'Default', hex: null },
  { name: 'White', hex: '#ffffff' },
  { name: 'Warm', hex: '#f5efe6' },
  { name: 'Ink', hex: '#1a1816' },
  { name: 'Black', hex: '#000000' },
];

// What the app looks like with no customisation, used for contrast checks and previews.
export const DEFAULT_BACKGROUND = '#0a0908';
export const DEFAULT_FOREGROUND = '#f5f4f2';
export const DEFAULT_ACCENT = '#f5c518';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export const isHex = (value: unknown): value is string => typeof value === 'string' && HEX_PATTERN.test(value);

/** Returns a lowercase hex color, or null when the value is empty or not a valid #rrggbb color. */
export function normalizeHex(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return isHex(trimmed) ? trimmed : null;
}

export function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')).join('');
}

/** Relative luminance (0 black, 1 white) as defined by WCAG. */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Black or white, whichever reads better on top of the given color. */
export const readableOn = (hex: string) => (luminance(hex) > 0.4 ? '#0a0908' : '#ffffff');

/** Hue 0-360, saturation and value 0-1. */
export function hexToHsv(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return [hue, max === 0 ? 0 : delta / max, max];
}

export function hsvToHex(hue: number, saturation: number, value: number) {
  const h = ((hue % 360) + 360) % 360;
  const c = value * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = value - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** The colors the dashboard will actually use, falling back to the defaults. */
export function effectiveColors(theme: ThemeSettings) {
  const background = theme.background ?? DEFAULT_BACKGROUND;
  const dark = luminance(background) < 0.4;
  // A custom background with no chosen text color gets whichever default text is readable on it.
  const foreground = theme.foreground ?? (theme.background ? (dark ? DEFAULT_FOREGROUND : '#1a1816') : DEFAULT_FOREGROUND);
  return { background, foreground, accent: theme.accent ?? DEFAULT_ACCENT, dark };
}

/** CSS that overrides the design tokens for the chosen colors. Empty when nothing is customised. */
export function themeCss(theme: ThemeSettings) {
  const rules: string[] = [];
  const { background, foreground, dark } = effectiveColors(theme);

  if (theme.accent) {
    rules.push(
      `--accent: ${theme.accent}`,
      `--accent-hover: color-mix(in srgb, ${theme.accent} 85%, white)`,
      `--accent-foreground: ${readableOn(theme.accent)}`,
      `--accent-soft: color-mix(in srgb, ${theme.accent} 14%, transparent)`,
      `--accent-glow: color-mix(in srgb, ${theme.accent} 20%, transparent)`,
    );
  }

  if (theme.background) {
    // Surfaces step away from the background toward the opposite end of the scale.
    const lift = dark ? 'white' : 'black';
    const surface = (percent: number) => `color-mix(in srgb, ${background} ${100 - percent}%, ${lift})`;
    rules.push(
      `--background: ${background}`,
      `--card: ${dark ? surface(5) : 'color-mix(in srgb, ' + background + ' 35%, white)'}`,
      `--popover: ${dark ? surface(9) : 'color-mix(in srgb, ' + background + ' 25%, white)'}`,
      `--surface-elevated: ${dark ? surface(8) : surface(4)}`,
      `--muted: ${dark ? surface(11) : surface(6)}`,
      `--secondary: ${dark ? surface(11) : surface(6)}`,
    );
  }

  if (theme.background || theme.foreground) {
    rules.push(
      `--foreground: ${foreground}`,
      `--muted-foreground: color-mix(in srgb, ${foreground} 62%, var(--background))`,
      `--primary: ${foreground}`,
      `--primary-foreground: ${background}`,
      `--border: color-mix(in srgb, ${foreground} 11%, transparent)`,
      `--border-strong: color-mix(in srgb, ${foreground} 26%, transparent)`,
      `--input: color-mix(in srgb, ${foreground} 14%, transparent)`,
    );
  }

  return rules.length ? `html.dark { ${rules.join('; ')}; }` : '';
}
