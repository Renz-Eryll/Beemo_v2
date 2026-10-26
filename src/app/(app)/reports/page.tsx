import type { Metadata } from "next";
import { HexMark, RangeRuler } from "@/components/Comb";
import MetricChart from "@/components/MetricChart";
import PageHeader, { SectionTitle } from "@/components/PageHeader";
import { MetricIcon, statusText } from "@/components/Status";
import type { Metric } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { listCycles, listHives, periodStats, readingSeries } from "@/lib/data";
import { dateLabel } from "@/lib/format";
import { generateInsights } from "@/lib/insights";
import { RANGES, rangeStatus, statusLabel } from "@/lib/ranges";

export const metadata: Metadata = { title: "Reports" };

const DAY = 86_400_000;
const PRESETS = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" } as const;

const TONE = {
  good: { label: "Good", tag: "bg-good-soft text-good", edge: "border-l-good" },
  watch: { label: "Watch", tag: "bg-honey-soft text-honey-text", edge: "border-l-gold" },
  warn: { label: "Warning", tag: "bg-high-soft text-high", edge: "border-l-high" },
} as const;

type Props = { searchParams: Promise<{ hive?: string; period?: string }> };

// One measure's period on a ruler: the bar spans lowest–highest, the marker sits on the headline value.
function MeasureCard({ metric, headline, marker, spread, foot }: { metric: Metric; headline: string; marker: number; spread: [number, number]; foot: React.ReactNode }) {
  const { label, min, max, unit } = RANGES[metric];
  const status = rangeStatus(metric, marker);
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-center gap-2 text-faint">
        <MetricIcon metric={metric} className="size-4" />
        <p className="eyebrow flex-1">{label}</p>
        <span className="num text-[11px]">
          {min}–{max}
          {unit}
        </span>
      </div>
      <p className="num mt-3 text-[28px] leading-none font-medium sm:text-[32px]">{headline}</p>
      <p className={`mt-1.5 text-[12px] font-semibold ${statusText(metric, status)}`}>{statusLabel(metric, status)}</p>
      <div className="mt-4">
        <RangeRuler metric={metric} value={marker} spread={spread} labels />
      </div>
      <div className="mt-auto flex justify-between gap-3 border-t border-line pt-3 text-xs text-muted">{foot}</div>
    </div>
  );
}

export default async function ReportsPage({ searchParams }: Props) {
  const session = await requireAdmin();
  const params = await searchParams;
  const hives = await listHives(session.apiaryId);

  if (hives.length === 0) {
    return (
      <>
        <PageHeader title="Reports" />
        <p className="card comb-light px-6 py-14 text-center text-sm text-muted">Add a hive to see reports.</p>
      </>
    );
  }

  const hive = hives.find((h) => h.id === params.hive) ?? hives[0];
  const cycles = await listCycles(session.apiaryId, hive.id);

  // A period is a preset ("30") or a harvest cycle ("cycle:<id>").
  const period = params.period ?? "30";
  const cycle = period.startsWith("cycle:") ? cycles.find((c) => c.id === period.slice(6)) : undefined;
  const to = cycle?.completedAt ? new Date(`${cycle.completedAt}T23:59:59+08:00`) : new Date();
  const from = cycle
    ? new Date(`${cycle.startDate}T00:00:00+08:00`)
    : new Date(Date.now() - Number(period in PRESETS ? period : "30") * DAY);
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY));
  const periodLabel = cycle ? `Cycle ${cycle.cycleNumber}` : PRESETS[(period in PRESETS ? period : "30") as keyof typeof PRESETS];

  const [stats, series] = await Promise.all([
    periodStats(hive.id, from, to),
    readingSeries(hive.id, from, days <= 7 ? 180 : 1440),
  ]);
  const insights = generateInsights(stats);
  const weightChange = stats.weight.end - stats.weight.start;
  const chartSpan = days <= 7 ? "week" : days <= 31 ? "month" : "quarter";

  return (
    <>
      <PageHeader
        eyebrow={periodLabel}
        title="Reports"
        description={`${hive.name} · ${dateLabel(from)} – ${dateLabel(to)}`}
        actions={
          <a href={`/api/reports/csv?hive=${hive.id}&from=${from.toISOString()}&to=${to.toISOString()}`} className="btn-outline">
            Export CSV
          </a>
        }
      />

      {/* Plain GET form: filters live in the URL, so reports can be bookmarked and shared. */}
      <form className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-0 flex-1 sm:flex-none">
          <label className="label" htmlFor="hive">
            Hive
          </label>
          <select id="hive" name="hive" defaultValue={hive.id} className="field sm:w-56">
            {hives.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1 sm:flex-none">
          <label className="label" htmlFor="period">
            Period
          </label>
          <select id="period" name="period" defaultValue={cycle ? period : period in PRESETS ? period : "30"} className="field sm:w-56">
            {Object.entries(PRESETS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
            {cycles.map((c) => (
              <option key={c.id} value={`cycle:${c.id}`}>
                Cycle {c.cycleNumber} ({c.status === "active" ? "in progress" : "completed"})
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary h-10 w-full sm:w-auto">Show</button>
      </form>

      {stats.count === 0 ? (
        <p className="card comb-light mt-8 px-6 py-14 text-center text-sm text-muted">No readings in this period.</p>
      ) : (
        <>
          <section className="mt-8" aria-label="Summary">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MeasureCard
                metric="temperature"
                headline={`${stats.temperature.avg.toFixed(1)}°C`}
                marker={stats.temperature.avg}
                spread={[stats.temperature.min, stats.temperature.max]}
                foot={
                  <>
                    <span>
                      Low <span className="num text-ink">{stats.temperature.min.toFixed(1)}°C</span>
                    </span>
                    <span>
                      High <span className="num text-ink">{stats.temperature.max.toFixed(1)}°C</span>
                    </span>
                  </>
                }
              />
              <MeasureCard
                metric="humidity"
                headline={`${stats.humidity.avg.toFixed(1)}%`}
                marker={stats.humidity.avg}
                spread={[stats.humidity.min, stats.humidity.max]}
                foot={
                  <>
                    <span>
                      Low <span className="num text-ink">{stats.humidity.min.toFixed(1)}%</span>
                    </span>
                    <span>
                      High <span className="num text-ink">{stats.humidity.max.toFixed(1)}%</span>
                    </span>
                  </>
                }
              />
              <MeasureCard
                metric="weight"
                headline={`${weightChange >= 0 ? "+" : "−"}${Math.abs(weightChange).toFixed(2)} kg`}
                marker={stats.weight.end}
                spread={[stats.weight.min, stats.weight.max]}
                foot={
                  <>
                    <span>
                      Low <span className="num text-ink">{stats.weight.min.toFixed(2)} kg</span>
                    </span>
                    <span>
                      High <span className="num text-ink">{stats.weight.max.toFixed(2)} kg</span>
                    </span>
                  </>
                }
              />
            </div>
            <p className="mt-3 text-xs text-faint">
              Averages for temperature and humidity; weight shows the change over the period. The bar spans the lowest to highest reading. Based on{" "}
              {stats.count.toLocaleString()} readings.
            </p>
          </section>

          <section className="mt-12">
            <SectionTitle>Insights</SectionTitle>
            <ul className="grid gap-3 lg:grid-cols-2">
              {insights.map((insight, i) => (
                <li key={i} className={`card flex flex-col gap-2 border-l-[3px] p-4 text-sm leading-relaxed ${TONE[insight.tone].edge}`}>
                  <span className={`cell-tag self-start ${TONE[insight.tone].tag}`}>
                    <HexMark className="bg-current" size="h-2 w-[7px]" />
                    {TONE[insight.tone].label}
                  </span>
                  <span>{insight.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12 space-y-4">
            <SectionTitle>{days <= 7 ? "3-hour" : "Daily"} averages</SectionTitle>
            <MetricChart metric="temperature" data={series} span={chartSpan} />
            <MetricChart metric="humidity" data={series} span={chartSpan} />
            <MetricChart metric="weight" data={series} span={chartSpan} />
          </section>
        </>
      )}
    </>
  );
}
