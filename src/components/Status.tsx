import type { Metric } from "@/db/schema";
import { RANGES, formatValue, rangeStatus, statusLabel, type RangeStatus } from "@/lib/ranges";

// Green = normal, red = too high, blue = too low (the original BeeMo convention).
// A label always accompanies the color.
export const STATUS_TEXT: Record<RangeStatus, string> = { low: "text-low", ok: "text-good", high: "text-high" };
const STATUS_PILL: Record<RangeStatus, string> = {
  low: "bg-low-soft text-low",
  ok: "bg-good-soft text-good",
  high: "bg-high-soft text-high",
};
const STATUS_DOT: Record<RangeStatus, string> = { low: "bg-low", ok: "bg-good", high: "bg-high" };

export function StatusPill({ metric, status }: { metric: Metric; status: RangeStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_PILL[status]}`}>
      <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden />
      {statusLabel(metric, status)}
    </span>
  );
}

export function MetricIcon({ metric, className = "size-5" }: { metric: Metric; className?: string }) {
  const p = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (metric === "temperature") {
    return (
      <svg {...p}>
        <path d="M10 14.5V4a2 2 0 1 1 4 0v10.5a4 4 0 1 1-4 0Z" />
        <path d="M12 18v-5" />
      </svg>
    );
  }
  if (metric === "humidity") {
    return (
      <svg {...p}>
        <path d="M12 3s6 6.7 6 11.2a6 6 0 0 1-12 0C6 9.7 12 3 12 3Z" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <path d="M4 7h16l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.3H7a1.5 1.5 0 0 1-1.5-1.3L4 7Z" />
      <path d="M9 7a3 3 0 1 1 6 0" />
    </svg>
  );
}

function RangeBar({ metric, value }: { metric: Metric; value: number }) {
  const { min, max } = RANGES[metric];
  const span = max - min;
  const lo = min - span;
  const hi = max + span;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  return (
    <div className="relative h-1.5 rounded-full bg-sunken" aria-hidden>
      <div className="absolute inset-y-0 rounded-full bg-honey-2" style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
      <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink" style={{ left: `${pct(value)}%` }} />
    </div>
  );
}

export function MetricTile({ metric, value, size = "md" }: { metric: Metric; value: number | null; size?: "md" | "lg" }) {
  const { label, min, max, unit } = RANGES[metric];
  const status = value == null ? null : rangeStatus(metric, value);
  const based = `${min}–${max}${unit === "%" ? "%" : ` ${unit}`}`;

  if (size === "md") {
    return (
      <div className="min-w-0">
        <p className="eyebrow truncate">{label}</p>
        <p className="num mt-1 text-[19px] leading-none font-medium">{value == null ? "—" : formatValue(metric, value)}</p>
        <div className="mt-2 h-5">{status && <StatusPill metric={metric} status={status} />}</div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <span className="text-faint">
          <MetricIcon metric={metric} />
        </span>
      </div>
      <p className="num mt-3 text-[34px] leading-none font-medium">{value == null ? "—" : formatValue(metric, value)}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {status ? <StatusPill metric={metric} status={status} /> : <span className="text-xs text-faint">Waiting for readings</span>}
        <span className="text-xs text-muted">Based {based}</span>
      </div>
      {value != null && (
        <div className="mt-4">
          <RangeBar metric={metric} value={value} />
        </div>
      )}
    </div>
  );
}

const ALERT_TAG = {
  high: { label: "Too high", cls: "bg-high-soft text-high" },
  low: { label: "Too low", cls: "bg-low-soft text-low" },
  harvest: { label: "Harvest", cls: "bg-honey-soft text-honey-text" },
} as const;

export function AlertTag({ state }: { state: keyof typeof ALERT_TAG }) {
  const t = ALERT_TAG[state];
  return <span className={`inline-flex shrink-0 rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold ${t.cls}`}>{t.label}</span>;
}
