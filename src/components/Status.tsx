import type { Metric } from "@/db/schema";
import { RANGES, STATUS_LABEL, formatValue, rangeStatus, type RangeStatus } from "@/lib/ranges";

const DOT: Record<RangeStatus, string> = { low: "bg-low", ok: "bg-good", high: "bg-high" };
const SOFT: Record<RangeStatus, string> = { low: "bg-low-soft", ok: "bg-good-soft", high: "bg-high-soft" };
const ARROW: Record<RangeStatus, string> = { low: "↓", ok: "✓", high: "↑" };
const SHORT: Record<RangeStatus, string> = { low: "Low", ok: "OK", high: "High" };

// Status is never color alone: a glyph and a label always come with it.
export function StatusPill({ status, label }: { status: RangeStatus; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-ink ${SOFT[status]}`}>
      <span className={`grid size-3.5 place-items-center rounded-full text-[9px] leading-none text-white ${DOT[status]}`} aria-hidden>
        {ARROW[status]}
      </span>
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}

// Where the value sits against its recommended range.
export function RangeBar({ metric, value }: { metric: Metric; value: number }) {
  const { min, max } = RANGES[metric];
  const span = max - min;
  const lo = min - span;
  const hi = max + span;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  const status = rangeStatus(metric, value);
  return (
    <div className="relative mt-3 h-1.5 rounded-full bg-sunken" aria-hidden>
      <div className="absolute inset-y-0 rounded-full bg-good/25" style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
      <div
        className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface ${DOT[status]}`}
        style={{ left: `${pct(value)}%` }}
      />
    </div>
  );
}

export function MetricTile({ metric, value, size = "md" }: { metric: Metric; value: number | null; size?: "md" | "lg" }) {
  const { label, min, max, unit } = RANGES[metric];
  const status = value == null ? null : rangeStatus(metric, value);
  return (
    <div className={size === "lg" ? "card p-5" : "rounded-lg bg-sunken/60 p-3"}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        {status && size === "lg" && <StatusPill status={status} />}
      </div>
      <p className={`num mt-1.5 font-medium ${size === "lg" ? "text-3xl" : "text-lg"}`}>
        {value == null ? "—" : formatValue(metric, value)}
      </p>
      {value != null && size === "lg" && <RangeBar metric={metric} value={value} />}
      {size === "lg" ? (
        <p className="mt-2 text-xs text-faint">
          Target {min}–{max}
          {unit}
        </p>
      ) : (
        status && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <span className={`size-1.5 rounded-full ${DOT[status]}`} aria-hidden />
            <span title={STATUS_LABEL[status]}>{SHORT[status]}</span>
          </p>
        )
      )}
    </div>
  );
}
