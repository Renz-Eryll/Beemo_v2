"use client";

import { CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Metric } from "@/db/schema";
import type { SeriesPoint } from "@/lib/data";
import { RANGES, STATUS_LABEL, formatValue, rangeStatus } from "@/lib/ranges";

type Props = { metric: Metric; data: SeriesPoint[]; span: "day" | "week" | "month" | "quarter" };

const KEY: Record<Metric, keyof SeriesPoint> = { temperature: "temperature", humidity: "humidity", weight: "weightKg" };
const TZ = "Asia/Manila";

const tick = (span: Props["span"]) => (t: number) =>
  new Date(t).toLocaleString("en-PH", span === "day" ? { hour: "numeric", timeZone: TZ } : { month: "short", day: "numeric", timeZone: TZ });

// One measure per chart (no dual axes); the recommended range is a neutral band.
export default function MetricChart({ metric, data, span }: Props) {
  const { label, min, max, unit } = RANGES[metric];
  const key = KEY[metric];

  if (data.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium">{label}</h3>
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
  const latest = values[values.length - 1];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <figure className="card p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-medium">
          {label} <span className="font-normal text-faint">({unit})</span>
        </h3>
        <p className="text-xs text-muted">
          Avg <span className="num text-ink">{formatValue(metric, avg)}</span>
          <span className="mx-2 text-faint">·</span>
          Latest <span className="num text-ink">{formatValue(metric, latest)}</span>
        </p>
      </figcaption>

      <div className="mt-4 h-48" role="img" aria-label={`${label} over time, target ${min} to ${max}${unit}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="0" />
            <ReferenceArea y1={min} y2={max} fill="var(--chart-band)" fillOpacity={1} ifOverflow="extendDomain" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={tick(span)}
              tick={{ fill: "var(--faint)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              tick={{ fill: "var(--faint)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              ticks={ticks.filter((_, i) => ticks.length <= 9 || i % 2 === 0)}
              interval={0}
            />
            <Tooltip
              cursor={{ stroke: "var(--faint)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as SeriesPoint;
                const value = point[key] as number;
                const status = rangeStatus(metric, value);
                return (
                  <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
                    <p className="text-faint">
                      {new Date(point.t).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: span === "day" || span === "week" ? "numeric" : undefined,
                        timeZone: TZ,
                      })}
                    </p>
                    <p className="num mt-0.5 text-sm text-ink">{formatValue(metric, value)}</p>
                    <p className="text-muted">{STATUS_LABEL[status]}</p>
                  </div>
                );
              }}
            />
            <Line
              dataKey={key}
              stroke="var(--chart-line)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--chart-line)" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 flex items-center gap-2 text-xs text-faint">
        <span className="inline-block h-2.5 w-4 rounded-sm bg-[var(--chart-band)]" aria-hidden /> Target {min}–{max}
        {unit}
      </p>
    </figure>
  );
}
