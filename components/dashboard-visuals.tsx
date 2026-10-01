import type { CSSProperties, ReactNode } from 'react';

/** `thickness` is the width of the colored ring in pixels; it defaults to a share of the size. */
export function ProgressRing({ value, size = 112, thickness, children }: { value: number; size?: number; thickness?: number; children?: ReactNode }) {
  const inner = size - 2 * (thickness ?? Math.round(size * 0.12));
  return (
    <div className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(var(--accent) 0 ${value}%, var(--surface-elevated) ${value}% 100%)` }}>
      <div className="grid place-items-center rounded-full bg-card" style={{ width: inner, height: inner }}>
        {children ?? <span className="text-xl font-semibold">{value}%</span>}
      </div>
    </div>
  );
}

export function Panel({ className = '', children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  return <section style={style} className={`rounded-[1.85rem] border border-border bg-card ${className}`}>{children}</section>;
}

export function AreaChart() {
  return (
    <svg viewBox="0 0 1200 330" className="h-full min-h-64 w-full" role="img" aria-label="Overall consistency trend">
      <defs>
        <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity=".32" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
      </defs>
      {[75, 155, 235].map((y) => <line key={y} x1="0" x2="1200" y1={y} y2={y} stroke="var(--border)" />)}
      <path d="M0 225 C65 185 105 176 150 207 S235 211 310 170 S400 135 485 145 S565 154 640 111 S755 101 795 160 S865 187 920 125 S1000 184 1060 147 S1140 146 1200 146 L1200 310 L0 310 Z" fill="url(#area-fill)" />
      <path d="M0 225 C65 185 105 176 150 207 S235 211 310 170 S400 135 485 145 S565 154 640 111 S755 101 795 160 S865 187 920 125 S1000 184 1060 147 S1140 146 1200 146" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      <line x1="920" x2="920" y1="125" y2="310" stroke="var(--accent)" strokeDasharray="5 6" opacity=".45" />
      <circle cx="920" cy="125" r="7" fill="var(--card)" stroke="var(--accent)" strokeWidth="3" />
    </svg>
  );
}
