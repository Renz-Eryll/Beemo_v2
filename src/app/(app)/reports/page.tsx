import type { Metadata } from "next";
import MetricChart from "@/components/MetricChart";
import { requireAdmin } from "@/lib/auth";
import { listCycles, listHives, periodStats, readingSeries } from "@/lib/data";
import { dateLabel } from "@/lib/format";
import { generateInsights } from "@/lib/insights";

export const metadata: Metadata = { title: "Reports" };

const DAY = 86_400_000;
const PRESETS = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" } as const;

type Props = { searchParams: Promise<{ hive?: string; period?: string }> };

export default async function ReportsPage({ searchParams }: Props) {
  const session = await requireAdmin();
  const params = await searchParams;
  const hives = await listHives(session.apiaryId);

  if (hives.length === 0) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="card mt-8 px-6 py-12 text-center text-sm text-muted">Add a hive to see reports.</p>
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            {hive.name} · {periodLabel} · {dateLabel(from)} – {dateLabel(to)}
          </p>
        </div>
        <a
          href={`/api/reports/csv?hive=${hive.id}&from=${from.toISOString()}&to=${to.toISOString()}`}
          className="btn-outline"
        >
          Export CSV
        </a>
      </div>

      {/* Plain GET form: filters live in the URL, so reports can be bookmarked and shared. */}
      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="hive">
            Hive
          </label>
          <select id="hive" name="hive" defaultValue={hive.id} className="field w-56">
            {hives.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="period">
            Period
          </label>
          <select id="period" name="period" defaultValue={cycle ? period : period in PRESETS ? period : "30"} className="field w-56">
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
        <button className="btn-primary">Show</button>
      </form>

      {stats.count === 0 ? (
        <p className="card mt-8 px-6 py-12 text-center text-sm text-muted">No readings in this period.</p>
      ) : (
        <>
          <div className="card mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Summary statistics</caption>
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 font-medium">Measure</th>
                  <th className="px-3 py-3 text-right font-medium">Average</th>
                  <th className="px-3 py-3 text-right font-medium">Lowest</th>
                  <th className="px-3 py-3 text-right font-medium">Highest</th>
                  <th className="px-5 py-3 text-right font-medium">Target</th>
                </tr>
              </thead>
              <tbody className="num divide-y divide-line">
                <tr>
                  <td className="px-5 py-3 font-sans">Temperature</td>
                  <td className="px-3 py-3 text-right">{stats.temperature.avg.toFixed(1)}°C</td>
                  <td className="px-3 py-3 text-right">{stats.temperature.min.toFixed(1)}°C</td>
                  <td className="px-3 py-3 text-right">{stats.temperature.max.toFixed(1)}°C</td>
                  <td className="px-5 py-3 text-right text-muted">32–35°C</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-sans">Humidity</td>
                  <td className="px-3 py-3 text-right">{stats.humidity.avg.toFixed(1)}%</td>
                  <td className="px-3 py-3 text-right">{stats.humidity.min.toFixed(1)}%</td>
                  <td className="px-3 py-3 text-right">{stats.humidity.max.toFixed(1)}%</td>
                  <td className="px-5 py-3 text-right text-muted">50–60%</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-sans">Hive weight</td>
                  <td className="px-3 py-3 text-right">
                    {weightChange >= 0 ? "+" : "−"}
                    {Math.abs(weightChange).toFixed(2)} kg
                  </td>
                  <td className="px-3 py-3 text-right">{stats.weight.min.toFixed(2)} kg</td>
                  <td className="px-3 py-3 text-right">{stats.weight.max.toFixed(2)} kg</td>
                  <td className="px-5 py-3 text-right text-muted">1–5 kg</td>
                </tr>
              </tbody>
            </table>
            <p className="border-t border-line px-5 py-2.5 text-xs text-faint">
              Weight shows the change over the period. Based on {stats.count.toLocaleString()} readings.
            </p>
          </div>

          <section className="mt-8">
            <h2 className="text-sm font-semibold">Insights</h2>
            <ul className="mt-3 space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="card flex gap-3 p-4 text-sm leading-relaxed">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${insight.tone === "good" ? "bg-good" : insight.tone === "warn" ? "bg-high" : "bg-honey"}`}
                    aria-hidden
                  />
                  <span>
                    <span className="sr-only">{insight.tone === "good" ? "Good: " : insight.tone === "warn" ? "Warning: " : "Watch: "}</span>
                    {insight.text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-sm font-semibold">{days <= 7 ? "3-hour" : "Daily"} averages</h2>
            <MetricChart metric="temperature" data={series} span={chartSpan} />
            <MetricChart metric="humidity" data={series} span={chartSpan} />
            <MetricChart metric="weight" data={series} span={chartSpan} />
          </section>
        </>
      )}
    </>
  );
}
