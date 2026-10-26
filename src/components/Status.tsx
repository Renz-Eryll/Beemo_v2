import type { Metric } from "@/db/schema";
import { RANGES, formatValue, rangeStatus, statusLabel, type RangeStatus } from "@/lib/ranges";
import { RangeRuler } from "./Comb";

// Green = normal, red = too high, blue = too low (the original BeeMo convention).
// A label always accompanies the color.
const STATUS_TEXT: Record<RangeStatus, string> = { low: "text-low", ok: "text-good", high: "text-high" };
const STATUS_PILL: Record<RangeStatus, string> = {
  low: "bg-low-soft text-low",
  ok: "bg-good-soft text-good",
  high: "bg-high-soft text-high",
};
const STATUS_DOT: Record<RangeStatus, string> = { low: "bg-low", ok: "bg-good", high: "bg-high" };
// Weight above the range is the harvest window, so it reads as honey, not as a warning.
const WEIGHT_TEXT: Record<RangeStatus, string> = { low: "text-muted", ok: "text-good", high: "text-honey-text" };
const STATUS_BRIGHT: Record<RangeStatus, string> = { low: "text-low-bright", ok: "text-good-bright", high: "text-high-bright" };
const WEIGHT_BRIGHT: Record<RangeStatus, string> = { low: "text-rail-muted", ok: "text-good-bright", high: "text-honey" };

export const statusText = (metric: Metric, status: RangeStatus, tone: "light" | "dark" = "light") =>
  (metric === "weight" ? (tone === "dark" ? WEIGHT_BRIGHT : WEIGHT_TEXT) : tone === "dark" ? STATUS_BRIGHT : STATUS_TEXT)[status];

export function StatusPill({ metric, status }: { metric: Metric; status: RangeStatus }) {
  return (
    <span className={`cell-tag ${STATUS_PILL[status]}`}>
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

// `md`: a compact row for hive cards. `lg`: the big reading inside a dark hero band.
export function MetricTile({ metric, value, size = "md" }: { metric: Metric; value: number | null; size?: "md" | "lg" }) {
  const { label, min, max, unit } = RANGES[metric];
  const status = value == null ? null : rangeStatus(metric, value);
  const based = `${min}–${max}${unit === "%" ? "%" : ` ${unit}`}`;

  if (size === "md") {
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="text-faint">
            <MetricIcon metric={metric} className="size-4" />
          </span>
          <span className="flex-1 truncate text-[13px] text-muted">{label}</span>
          <span className="num text-[15px] font-medium">{value == null ? "—" : formatValue(metric, value)}</span>
        </div>
        <div className="mt-1.5 grid grid-cols-[1fr_auto] items-center gap-3 pl-[26px]">
          {value != null ? <RangeRuler metric={metric} value={value} /> : <span className="h-4" />}
          <span className={`w-[92px] truncate text-right text-[11px] font-semibold ${status ? statusText(metric, status) : "text-faint"}`}>
            {status ? statusLabel(metric, status) : "No data"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-rail-muted">
        <MetricIcon metric={metric} className="size-4" />
        <p className="eyebrow text-rail-muted">{label}</p>
      </div>
      <p className="num mt-3 text-[34px] leading-none font-medium sm:text-[40px]">
        {value == null ? "—" : formatValue(metric, value).replace(unit, "")}
        <span className="ml-1 text-[18px] text-rail-muted">{unit}</span>
      </p>
      <p className={`mt-2 text-[13px] font-semibold ${status ? statusText(metric, status, "dark") : "text-rail-muted"}`}>
        {status ? statusLabel(metric, status) : "Waiting for readings"}
      </p>
      <div className="mt-4">
        {value != null && <RangeRuler metric={metric} value={value} tone="dark" labels />}
        <p className="text-[11px] text-rail-muted">Target {based}</p>
      </div>
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
  return <span className={`cell-tag ${t.cls}`}>{t.label}</span>;
}
