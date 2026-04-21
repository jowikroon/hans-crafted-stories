// apps/personal/src/components/portal/blog/primitives.tsx
// Shared editorial primitives for the Blog CMS.
// Consumes HSL tokens from apps/personal/src/index.css (.dark scope).
// No hardcoded colors — everything scales with the global theme.

import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── RADAR ────────────────────────────────────────────────────────────────
// 4-axis NNg tone chart: Formality (top), Humor (right), Respect (bottom), Enthusiasm (left).
// `values` is the actual writing; `target` is the voice template goal.
export interface RadarProps {
  values: number[];
  target?: number[];
  size?: number;
  max?: number;
  showLabels?: boolean;
  labels?: [string, string, string, string];
  fillOpacity?: number;
  rings?: number;
  stroke?: string;
  targetStroke?: string;
}

export function Radar({
  values,
  target,
  size = 180,
  max = 10,
  showLabels = true,
  labels = ["FORMAL", "PLAYFUL", "RESPECT", "ENTHUS"],
  fillOpacity = 0.18,
  rings = 5,
  stroke = "hsl(var(--primary))",
  targetStroke = "hsl(var(--foreground) / 0.35)",
}: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;
  const axes = 4;
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / axes;

  const point = (val: number, i: number): [number, number] => {
    const a = angleFor(i);
    const rr = (val / max) * r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };

  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const [x, y] = point(v, i);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  const ringPolys: string[] = [];
  for (let k = 1; k <= rings; k++) {
    const rr = (k / rings) * r;
    const pts: string[] = [];
    for (let i = 0; i < axes; i++) {
      const a = angleFor(i);
      pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
    }
    ringPolys.push(pts.join(" "));
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {ringPolys.map((p, i) => (
        <polygon
          key={i}
          points={p}
          fill="none"
          stroke="hsl(var(--border) / 0.6)"
          strokeWidth={1}
          strokeDasharray={i === rings - 1 ? "0" : "2 3"}
          opacity={i === rings - 1 ? 0.9 : 0.5}
        />
      ))}
      {Array.from({ length: axes }).map((_, i) => {
        const [x, y] = point(max, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="hsl(var(--border) / 0.6)"
            strokeWidth={1}
          />
        );
      })}
      {target && (
        <path
          d={toPath(target)}
          fill="none"
          stroke={targetStroke}
          strokeWidth={1.25}
          strokeDasharray="4 3"
        />
      )}
      <path
        d={toPath(values)}
        fill={stroke}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const [x, y] = point(v, i);
        return <circle key={i} cx={x} cy={y} r={2.5} fill={stroke} />;
      })}
      {showLabels &&
        labels.map((lbl, i) => {
          const [x, y] = point(max * 1.18, i);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontSize={9}
              letterSpacing={1.2}
              fill="hsl(var(--muted-foreground))"
            >
              {lbl}
            </text>
          );
        })}
      <circle cx={cx} cy={cy} r={1.5} fill="hsl(var(--muted-foreground))" />
    </svg>
  );
}

// ─── SPECTRUM SLIDER (0–10 with target tick) ──────────────────────────────
export interface SpectrumProps {
  leftLabel: string;
  rightLabel: string;
  value: number;
  target?: number;
  max?: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
}

export function Spectrum({
  leftLabel,
  rightLabel,
  value,
  target,
  max = 10,
  onChange,
  disabled = false,
}: SpectrumProps) {
  const pct = (value / max) * 100;
  const tpct = target != null ? (target / max) * 100 : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-[10.5px] tracking-[0.08em]">
        <span className="uppercase text-muted-foreground">{leftLabel}</span>
        <span className="text-[12px] font-semibold text-primary">{value}</span>
        <span className="uppercase text-muted-foreground">{rightLabel}</span>
      </div>
      <div className="relative h-9 flex items-center">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-muted rounded" />
        <div className="absolute inset-0 flex justify-between items-center px-[2px] pointer-events-none">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className={cn("w-px bg-border", i === 5 ? "h-3" : "h-2")}
            />
          ))}
        </div>
        {tpct != null && (
          <div
            className="absolute top-[4px] bottom-[4px] w-[2px] bg-foreground/35 rounded-[1px]"
            style={{ left: `${tpct}%` }}
          />
        )}
        <div
          className="absolute h-[2px] bg-primary rounded"
          style={{
            left: "50%",
            width: `${Math.abs(pct - 50)}%`,
            transform: `translateY(-50%) ${pct < 50 ? "translateX(-100%)" : ""}`,
            top: "50%",
          }}
        />
        <div
          className="absolute w-[14px] h-[14px] rounded-full bg-primary border-2 border-background shadow-md"
          style={{
            left: `${pct}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 0 1px hsl(var(--primary)), 0 2px 8px hsl(var(--primary) / 0.35)",
          }}
        />
        {onChange && !disabled && (
          <input
            type="range"
            min={0}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}

// ─── METER (progress bar with optional target tick) ───────────────────────
export interface MeterProps {
  value: number;
  target?: number;
  max?: number;
  color?: string;
  height?: number;
}

export function Meter({
  value,
  target,
  max = 100,
  color = "hsl(var(--primary))",
  height = 4,
}: MeterProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tpct = target != null ? (target / max) * 100 : null;
  return (
    <div
      className="relative rounded overflow-hidden"
      style={{ height, background: "hsl(var(--muted) / 0.6)" }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
      {tpct != null && (
        <div
          className="absolute -top-[3px] w-[2px]"
          style={{
            left: `${tpct}%`,
            height: height + 6,
            background: "hsl(var(--foreground) / 0.55)",
          }}
        />
      )}
    </div>
  );
}

// ─── STAT (label + numeric readout) ───────────────────────────────────────
export interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  tone?: "default" | "ok" | "warn" | "bad" | "primary";
}

export function Stat({ label, value, unit, delta, tone = "default" }: StatProps) {
  const toneColor: Record<string, string> = {
    default: "hsl(var(--foreground))",
    ok: "hsl(140 35% 55%)",
    warn: "hsl(38 70% 58%)",
    bad: "hsl(0 55% 58%)",
    primary: "hsl(var(--primary))",
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="font-mono text-[22px] font-medium tracking-tight"
          style={{ color: toneColor[tone] }}
        >
          {value}
        </span>
        {unit && <span className="font-mono text-[10px] text-muted-foreground">{unit}</span>}
        {delta && (
          <span className="font-mono text-[10px] text-muted-foreground ml-1.5">{delta}</span>
        )}
      </div>
    </div>
  );
}

// ─── SEC-LABEL (numbered section label with line) ─────────────────────────
export interface SecLabelProps {
  idx?: string | number;
  children: ReactNode;
  className?: string;
}

export function SecLabel({ idx, children, className }: SecLabelProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {idx != null && (
        <span className="font-mono text-primary text-[10px] font-semibold tracking-[0.2em]">
          {typeof idx === "number" ? String(idx).padStart(2, "0") : idx}
        </span>
      )}
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {children}
      </span>
      <span className="flex-1 h-px bg-border/60" />
    </div>
  );
}

// ─── CHIP (status/tag pills) ──────────────────────────────────────────────
export type ChipTone = "default" | "primary" | "green" | "amber" | "red";
export interface ChipProps {
  tone?: ChipTone;
  dot?: boolean;
  strike?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Chip({
  tone = "default",
  dot = false,
  strike = false,
  children,
  onClick,
  className,
}: ChipProps) {
  const toneClasses: Record<ChipTone, string> = {
    default: "text-muted-foreground border-border",
    primary: "text-primary border-primary/35 bg-primary/[0.08]",
    green: "text-[hsl(140_35%_55%)] border-[hsl(140_35%_55%)/0.3] bg-[hsl(140_35%_55%)/0.08]",
    amber: "text-[hsl(38_70%_58%)] border-[hsl(38_70%_58%)/0.3] bg-[hsl(38_70%_58%)/0.08]",
    red: "text-[hsl(0_55%_58%)] border-[hsl(0_55%_58%)/0.3] bg-[hsl(0_55%_58%)/0.08]",
  };
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-[3px] border font-mono text-[10.5px] tracking-wide bg-transparent",
        toneClasses[tone],
        strike && "line-through decoration-[hsl(0_55%_58%)/0.6]",
        onClick && "cursor-pointer hover:brightness-110",
        className
      )}
    >
      {dot && (
        <span
          className="inline-block w-[5px] h-[5px] rounded-full"
          style={{ background: "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}

// ─── KBD (keyboard hint) ──────────────────────────────────────────────────
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      className="font-mono text-[10px] px-[5px] py-[1px] border border-border border-b-2 rounded-[3px] text-muted-foreground"
      style={{ background: "hsl(var(--card) / 0.8)" }}
    >
      {children}
    </span>
  );
}

// ─── EYEBROW (small overline text) ────────────────────────────────────────
export function Eyebrow({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
