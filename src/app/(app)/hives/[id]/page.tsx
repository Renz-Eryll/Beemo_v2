import type { Metadata } from "next";
import Link from "next/link";
import MetricChart from "@/components/MetricChart";
import { MetricTile } from "@/components/Status";
import { alertMessage } from "@/lib/alerts";
import { requireSession } from "@/lib/auth";
import { getHive, latestReading, listAlerts, listCycles, readingSeries } from "@/lib/data";
import { dateLabel, dateTimeLabel, isOnline, timeAgo } from "@/lib/format";

const SPANS = {
  day: { label: "24 hours", ms: 24 * 3_600_000, bucket: 60 },
  week: { label: "7 days", ms: 7 * 24 * 3_600_000, bucket: 120 },
  month: { label: "30 days", ms: 30 * 24 * 3_600_000, bucket: 720 },
  quarter: { label: "90 days", ms: 90 * 24 * 3_600_000, bucket: 1440 },
} as const;
type Span = keyof typeof SPANS;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ range?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await requireSession();
  const hive = await getHive(session.apiaryId, (await params).id);
  return { title: hive.name };
}

export default async function HivePage({ params, searchParams }: Props) {
  const session = await requireSession();
  const { id } = await params;
  const { range } = await searchParams;
  const span: Span = range && range in SPANS ? (range as Span) : "week";

  const hive = await getHive(session.apiaryId, id);
  const [latest, series, alerts, cycles] = await Promise.all([
    latestReading(hive.id),
    readingSeries(hive.id, new Date(Date.now() - SPANS[span].ms), SPANS[span].bucket),
    listAlerts(session.apiaryId, { hiveId: hive.id, limit: 8 }),
    listCycles(session.apiaryId, hive.id),
  ]);
  const active = cycles.find((c) => c.status === "active");
  const online = isOnline(hive.lastSeenAt);

  return (
    <>
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Overview
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{hive.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {hive.location && <span>{hive.location}</span>}
            <span className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${online ? "bg-good" : "bg-faint"}`} aria-hidden />
              {latest ? `Last reading ${timeAgo(latest.recordedAt)}` : "Waiting for the first reading"}
            </span>
          </p>
        </div>
        {session.role === "admin" && (
          <Link href={`/hives/${hive.id}/device`} className="btn-outline">
            Device &amp; settings
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricTile metric="temperature" value={latest?.temperature ?? null} size="lg" />
        <MetricTile metric="humidity" value={latest?.humidity ?? null} size="lg" />
        <MetricTile metric="weight" value={latest?.weightKg ?? null} size="lg" />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">History</h2>
        <div role="tablist" aria-label="Time range" className="flex gap-1 rounded-md bg-sunken p-1">
          {(Object.keys(SPANS) as Span[]).map((key) => (
            <Link
              key={key}
              role="tab"
              aria-selected={span === key}
              href={`?range=${key}`}
              scroll={false}
              className={`rounded px-2.5 py-1 text-xs ${span === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {SPANS[key].label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <MetricChart metric="temperature" data={series} span={span} />
          <MetricChart metric="humidity" data={series} span={span} />
          <MetricChart metric="weight" data={series} span={span} />
        </div>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-sm font-semibold">Harvest cycle</h2>
            {active ? (
              <>
                <p className="mt-3 text-2xl font-medium">Cycle {active.cycleNumber}</p>
                <p className="text-sm text-muted">
                  {dateLabel(active.startDate)} → {dateLabel(active.plannedEndDate)}
                </p>
                <Link href="/harvest" className="mt-4 inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
                  Record a harvest
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                No active cycle.{" "}
                <Link href="/harvest" className="underline underline-offset-2">
                  Start one
                </Link>
              </p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold">Recent alerts</h2>
            {alerts.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nothing out of range recently.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {alerts.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className={a.readAt ? "text-muted" : ""}>{alertMessage(a)}</p>
                    <p className="text-xs text-faint">{dateTimeLabel(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
