"use client";

import { useId } from "react";
import { Area, CartesianGrid, ComposedChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Metric } from "@/db/schema";
import type { SeriesPoint } from "@/lib/data";
import { RANGES, formatValue, rangeStatus, statusLabel } from "@/lib/ranges";
import { STATUS_TEXT } from "./Status";

type Props = { metric: Metric; data: SeriesPoint[]; span: "day" | "week" | "month" | "quarter" };

const KEY: Record<Metric, keyof SeriesPoint> = { temperature: "temperature", humidity: "humidity", weight: "weightKg" };
const TZ = "Asia/Manila";
// One palette for every chart: the brand gold line over a soft honey fill, neutral target band.
const GOLD = "#d4a017";
const HONEY = "#f3d96b";
const AXIS = "#857f73";
const GRID = "#e6e2d9";

const tick = (span: Props["span"]) => (t: number) =>
  new Date(t).toLocaleString("en-PH", span === "day" ? { hour: "numeric", timeZone: TZ } : { month: "short", day: "numeric", timeZone: TZ });

// One measure per chart (no dual axes); the recommended range is a neutral band with dashed limits.
export default function MetricChart({ metric, data, span }: Props) {
  const gradientId = useId().replace(/:/g, "");
  const { label, min, max, unit } = RANGES[metric];
  const key = KEY[metric];

  if (data.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="display text-[16px]">{label}</h3>
        <p className="mt-10 mb-12 text-center text-sm text-faint">No readings in this period yet.</p>
      </div>
    );
  }

  const values = data.map((d) => d[key] as number);
  // Show the target band plus a margin, snapped to whole steps; weight never goes below 0.
  const step = { temperature: 1, humidity: 5, weight: 1 }[metric];
  const pad = (max - min) * 0.35;
  const domain: [number, number] = [
    Math.max(metric === "weight" ? 0 : -Infinity, Math.floor(Math.min(min - pad, ...values) / step) * step),
    Math.ceil(Math.max(max + pad, ...values) / step) * step,
  ];
  const ticks = Array.from({ length: Math.round((domain[1] - domain[0]) / step) + 1 }, (_, i) => domain[0] + i * step);
  // Multi-day ranges: one tick per Manila midnight (thinned to ≤ 8) so dates don't repeat.
  const DAY_MS = 86_400_000;
  const PH_OFFSET = 8 * 3_600_000;
  const first = data[0].t;
  const last = data[data.length - 1].t;
  const firstMidnight = Math.ceil((first + PH_OFFSET) / DAY_MS) * DAY_MS - PH_OFFSET;
  const dayTicks: number[] = [];
  for (let t = firstMidnight; t <= last; t += DAY_MS) dayTicks.push(t);
  const every = Math.ceil(dayTicks.length / 8);
  const xTicks = span === "day" ? undefined : dayTicks.filter((_, i) => i % every === 0);

  const latest = values[values.length - 1];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <figure className="card p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="display text-[16px]">
          {label} <span className="font-sans text-[12px] font-normal tracking-normal text-faint normal-case">({unit})</span>
        </h3>
        <p className="text-[12px] text-muted">
          Avg <span className="num text-ink">{formatValue(metric, avg)}</span>
          <span className="mx-2 text-line-strong">|</span>
          Latest <span className="num text-ink">{formatValue(metric, latest)}</span>
        </p>
      </figcaption>

      <div className="mt-4 h-48" role="img" aria-label={`${label} over time, target ${min} to ${max}${unit}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HONEY} stopOpacity={0.55} />
                <stop offset="100%" stopColor={HONEY} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <ReferenceArea y1={min} y2={max} fill="#ebe8e1" fillOpacity={0.7} />
            <ReferenceLine y={min} stroke={AXIS} strokeDasharray="4 4" strokeWidth={1} />
            <ReferenceLine y={max} stroke={AXIS} strokeDasharray="4 4" strokeWidth={1} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={tick(span)}
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              ticks={xTicks}
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
              axisLine={false}
              tickLine={false}
              width={40}
              ticks={ticks.filter((_, i) => ticks.length <= 9 || i % 2 === 0)}
              interval={0}
            />
            <Tooltip
              cursor={{ stroke: "#24211c", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as SeriesPoint;
                const value = point[key] as number;
                const status = rangeStatus(metric, value);
                return (
                  <div className="rounded-[6px] border border-line bg-surface px-3 py-2 text-xs shadow-[0_6px_16px_rgba(36,33,28,0.12)]">
                    <p className="text-faint">
                      {new Date(point.t).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: span === "day" || span === "week" ? "numeric" : undefined,
                        timeZone: TZ,
                      })}
                    </p>
                    <p className="num mt-0.5 text-sm text-ink">{formatValue(metric, value)}</p>
                    <p className={`font-semibold ${STATUS_TEXT[status]}`}>{statusLabel(metric, status)}</p>
                  </div>
                );
              }}
            />
            <Area
              dataKey={key}
              type="monotone"
              stroke={GOLD}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4.5, strokeWidth: 2, stroke: "#fbfaf7", fill: GOLD }}
              isAnimationActive={false}
              baseValue={domain[0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[12px] text-muted">
        <span className="inline-block h-2.5 w-5 rounded-[2px] border-y border-dashed border-faint bg-[#ebe8e1]" aria-hidden />
        Target {min}–{max}
        {unit}
      </p>
    </figure>
  );
}
