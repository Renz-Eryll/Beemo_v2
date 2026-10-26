import Link from "next/link";
import type { Metric } from "@/db/schema";
import { RANGES, rangeStatus, type RangeStatus } from "@/lib/ranges";

// Comb visuals: hives drawn as honeycomb cells that fill with honey as they gain weight,
// cycles counted in cells, and readings placed on a ruler against the target band.

const SQRT3 = Math.sqrt(3);
export const CYCLE_DAYS = 182;

type ReadingLike = { temperature: number; humidity: number; weightKg: number } | null;

// The worst of temperature and humidity; weight above range is good news, so it doesn't count.
export function hiveCondition(latest: ReadingLike): RangeStatus | null {
  if (!latest) return null;
  const s = [rangeStatus("temperature", latest.temperature), rangeStatus("humidity", latest.humidity)];
  return s.includes("high") ? "high" : s.includes("low") ? "low" : "ok";
}

const CONDITION_RING: Record<RangeStatus, string> = { ok: "bg-honey-2", high: "bg-high-bright", low: "bg-low-bright" };
const CONDITION_TEXT: Record<RangeStatus, string> = { ok: "text-good-bright", high: "text-high-bright", low: "text-low-bright" };
const CONDITION_LABEL: Record<RangeStatus, string> = { ok: "In range", high: "Too warm or damp", low: "Too cool or dry" };
const CONDITION_SHORT: Record<RangeStatus, string> = { ok: "In range", high: "Too high", low: "Too low" };

export type CombHive = { id: string; name: string; online: boolean; latest: ReadingLike };

/** One comb cell: the outline shows the hive's condition, the honey level its weight toward 5 kg.
 *  Fills its positioned parent, which should be an `@container` so the text scales with the cell;
 *  `large` is the standalone cell on a hive's page. */
export function HoneyCell({ hive, large = false }: { hive: CombHive; large?: boolean }) {
  const weight = hive.latest?.weightKg ?? 0;
  const level = Math.min(1, weight / RANGES.weight.max);
  const ready = weight >= RANGES.weight.max;
  const condition = hive.online ? hiveCondition(hive.latest) : null;
  const status = !hive.online ? "Offline" : ready ? "Ready to harvest" : condition ? CONDITION_LABEL[condition] : "No readings";
  const short = !hive.online ? "Offline" : ready ? "Harvest" : condition ? CONDITION_SHORT[condition] : "Waiting";
  // Text sitting below the honey line switches to ink.
  const ink = (from: number) => (level > from ? "text-ink" : "");
  const ring = condition ? CONDITION_RING[condition] : "bg-rail-line";

  const body = (
    <span className={`hex-flat absolute overflow-hidden ${large ? "inset-[3px]" : "inset-[2.5px]"} ${hive.online ? "bg-rail-2" : "bg-rail"}`}>
      <span
        className={`absolute inset-x-0 bottom-0 ${ready ? "bg-gold" : "bg-honey-2/80"} ${hive.online ? "" : "opacity-30"}`}
        style={{ height: `${level * 100}%` }}
        aria-hidden
      />
      <span className="comb-dark absolute inset-0 opacity-60" aria-hidden />
      <span className="relative flex h-full flex-col items-center justify-center px-[16%] text-center">
        {!large && <span className={`w-full truncate text-[8cqw] font-semibold text-rail-ink ${ink(0.62)}`}>{hive.name}</span>}
        <span className={`num leading-tight font-medium text-rail-ink ${large ? "text-[17cqw]" : "text-[12.5cqw]"} ${ink(0.45)}`}>
          {hive.latest ? weight.toFixed(2) : "—"}
          <span className="text-[0.55em]"> kg</span>
        </span>
        <span
          className={`mt-0.5 w-full truncate font-semibold tracking-[0.06em] uppercase ${large ? "text-[6.5cqw]" : "text-[6cqw]"} ${
            level > 0.3 ? "text-ink/75" : condition ? CONDITION_TEXT[condition] : "text-rail-muted"
          }`}
        >
          {large ? `${Math.round(level * 100)}% to harvest` : short}
        </span>
      </span>
    </span>
  );

  if (large) {
    return (
      <span role="img" aria-label={`${hive.name}: ${status}`} className={`hex-flat absolute inset-0 ${ring}`}>
        {body}
      </span>
    );
  }
  return (
    <Link
      href={`/hives/${hive.id}`}
      title={`${hive.name}: ${status}`}
      className={`hex-flat group absolute inset-0 block transition-transform hover:z-10 hover:scale-[1.04] ${ring}`}
    >
      {body}
    </Link>
  );
}

/** Flat-topped cells laid out in staggered columns, like a frame of comb. Empty cells complete the last row. */
export function ApiaryComb({ hives, columns, addHref }: { hives: CombHive[]; columns: number; addHref?: string }) {
  const cols = Math.min(columns, Math.max(hives.length + (addHref ? 1 : 0), 2));
  const total = Math.max(cols, Math.ceil((hives.length + (addHref ? 1 : 0)) / cols) * cols);
  const rows = Math.ceil(total / cols);
  // Slot geometry in "cell widths": columns step 0.75, odd columns drop half a cell.
  const h = SQRT3 / 2;
  const width = 0.75 * (cols - 1) + 1;
  const height = h * rows + (cols > 1 ? h / 2 : 0);
  const pos = (i: number) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      left: `${((col * 0.75) / width) * 100}%`,
      top: `${((row * h + (col % 2) * (h / 2)) / height) * 100}%`,
      width: `${(0.955 / width) * 100}%`,
      height: `${((h * 0.955) / height) * 100}%`,
    };
  };

  return (
    <div className="relative w-full" style={{ maxWidth: `${width * (total <= 4 ? 176 : 140)}px`, aspectRatio: `${width} / ${height}` }}>
      {Array.from({ length: total }, (_, i) => {
        const hive = hives[i];
        if (hive) {
          return (
            <div key={hive.id} className="@container absolute" style={pos(i)}>
              <HoneyCell hive={hive} />
            </div>
          );
        }
        const isAdd = addHref && i === hives.length;
        return (
          <div key={`ghost-${i}`} className="absolute" style={pos(i)}>
            {isAdd ? (
              <Link href={addHref} className="hex-flat absolute inset-0 grid place-items-center bg-rail-line/70 text-rail-muted transition-colors hover:bg-honey-2/40 hover:text-honey">
                <span className="hex-flat absolute inset-[2px] bg-rail" aria-hidden />
                <span className="relative text-center text-[11px] font-semibold tracking-[0.06em] uppercase">
                  <span className="block text-[22px] leading-none font-normal">+</span>
                  Add hive
                </span>
              </Link>
            ) : (
              <span className="hex-flat absolute inset-0 bg-rail-line/45" aria-hidden>
                <span className="hex-flat absolute inset-[1.5px] bg-rail" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const hexPoints = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (60 * k - 90);
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

/** A row of comb cells, one per week of the cycle, capped as they fill. */
export function CombMeter({ days, total = CYCLE_DAYS, tone = "light" }: { days: number; total?: number; tone?: "light" | "dark" }) {
  const cells = Math.round(total / 7);
  const done = Math.min(cells, Math.floor(days / 7));
  const r = 6;
  const w = SQRT3 * r;
  const step = w + 1.6;
  const empty = tone === "dark" ? "#3a362e" : "#c4bfb3";
  return (
    <svg
      viewBox={`0 0 ${cells * step} ${r * 2 + 2}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`Week ${Math.min(cells, done + 1)} of ${cells}`}
    >
      {Array.from({ length: cells }, (_, i) => {
        const state = i < done ? "full" : i === done && days < total ? "now" : "empty";
        return (
          <polygon
            key={i}
            points={hexPoints(w / 2 + i * step, r + 1, r)}
            fill={state === "full" ? "#f3d96b" : state === "now" ? (tone === "dark" ? "rgba(243,217,107,0.25)" : "#fbf5d2") : "none"}
            stroke={state === "empty" ? empty : "#d4a017"}
            strokeWidth={state === "now" ? 1.4 : 1}
          />
        );
      })}
    </svg>
  );
}

const STATUS_MARK: Record<RangeStatus, string> = { ok: "bg-good", high: "bg-high", low: "bg-low" };
const STATUS_MARK_DARK: Record<RangeStatus, string> = { ok: "bg-good-bright", high: "bg-high-bright", low: "bg-low-bright" };

/** A reading on a ruler: the honey band is the target range, the cell marker the value.
 *  With `spread`, a bar shows the lowest–highest of a period around the marker. */
export function RangeRuler({
  metric,
  value,
  spread,
  tone = "light",
  labels = false,
}: {
  metric: Metric;
  value: number;
  spread?: [number, number];
  tone?: "light" | "dark";
  labels?: boolean;
}) {
  const { min, max } = RANGES[metric];
  const width = max - min;
  const lo = metric === "weight" ? 0 : min - width;
  const hi = max + width;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
  const status = metric === "weight" ? "ok" : rangeStatus(metric, value);
  const dark = tone === "dark";

  return (
    <div aria-hidden className={labels ? "pb-4" : ""}>
      <div className="relative h-4">
        <div className={`absolute inset-x-0 top-1/2 h-px ${dark ? "bg-rail-line" : "bg-line-strong"}`} />
        <div
          className={`absolute top-1/2 h-2 -translate-y-1/2 ${dark ? "bg-honey-2/30" : "bg-honey-soft"} border-x ${dark ? "border-honey-2" : "border-gold"}`}
          style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
        />
        {spread && (
          <div
            className={`absolute top-1/2 h-[3px] -translate-y-1/2 ${dark ? "bg-rail-ink/50" : "bg-ink/35"}`}
            style={{ left: `${pct(spread[0])}%`, right: `${100 - pct(spread[1])}%` }}
          />
        )}
        <span
          className={`hex absolute top-1/2 h-[13px] w-[11px] -translate-x-1/2 -translate-y-1/2 ${dark ? "bg-rail" : "bg-surface"}`}
          style={{ left: `${pct(value)}%` }}
        >
          <span className={`hex absolute inset-[2px] ${(dark ? STATUS_MARK_DARK : STATUS_MARK)[status]}`} />
        </span>
        {labels && (
          <>
            <span className={`num absolute top-full mt-0.5 -translate-x-1/2 text-[10px] ${dark ? "text-rail-muted" : "text-faint"}`} style={{ left: `${pct(min)}%` }}>
              {min}
            </span>
            <span className={`num absolute top-full mt-0.5 -translate-x-1/2 text-[10px] ${dark ? "text-rail-muted" : "text-faint"}`} style={{ left: `${pct(max)}%` }}>
              {max}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/** An icon-sized cell: just the honey level, for lists. */
export function MiniCell({ weight, online, className = "w-14" }: { weight: number | null; online: boolean; className?: string }) {
  const level = Math.min(1, (weight ?? 0) / RANGES.weight.max);
  return (
    <span className={`hex-flat relative block aspect-[1/0.866] shrink-0 ${online ? "bg-gold" : "bg-line-strong"} ${className}`} aria-hidden>
      <span className="hex-flat absolute inset-[2px] overflow-hidden bg-sunken">
        <span className={`absolute inset-x-0 bottom-0 ${weight != null && weight >= RANGES.weight.max ? "bg-gold" : "bg-honey-2"} ${online ? "" : "opacity-40"}`} style={{ height: `${level * 100}%` }} />
      </span>
    </span>
  );
}

/** A small filled hexagon used as a list marker. */
export function HexMark({ className = "bg-gold", size = "size-2.5" }: { className?: string; size?: string }) {
  return <span className={`hex inline-block shrink-0 ${size} ${className}`} aria-hidden />;
}
