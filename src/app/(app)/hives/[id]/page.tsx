import type { Metadata } from "next";
import Link from "next/link";
import MetricChart from "@/components/MetricChart";
import PageHeader from "@/components/PageHeader";
import { AlertTag, MetricTile } from "@/components/Status";
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

  const cycleDays = active ? Math.max(0, Math.round((Date.now() - new Date(active.startDate).getTime()) / 86_400_000)) : 0;

  return (
    <>
      <PageHeader
        back={{ href: "/", label: "Overview" }}
        title={hive.name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {hive.location && <span>{hive.location}</span>}
            <span className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${online ? "bg-good" : "bg-line-strong"}`} aria-hidden />
              {latest ? `Last reading ${timeAgo(latest.recordedAt)}` : "Waiting for the first reading"}
            </span>
          </span>
        }
        actions={
          session.role === "admin" && (
            <Link href={`/hives/${hive.id}/device`} className="btn-outline">
              Device &amp; settings
            </Link>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile metric="temperature" value={latest?.temperature ?? null} size="lg" />
        <MetricTile metric="humidity" value={latest?.humidity ?? null} size="lg" />
        <MetricTile metric="weight" value={latest?.weightKg ?? null} size="lg" />
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <h2 className="display pb-2.5 text-[18px]">History</h2>
        <div role="tablist" aria-label="Time range" className="flex gap-5">
          {(Object.keys(SPANS) as Span[]).map((key) => (
            <Link key={key} role="tab" aria-selected={span === key} href={`?range=${key}`} scroll={false} className={span === key ? "tab-active" : "tab"}>
              {SPANS[key].label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <MetricChart metric="temperature" data={series} span={span} />
          <MetricChart metric="humidity" data={series} span={span} />
          <MetricChart metric="weight" data={series} span={span} />
        </div>

        <div className="space-y-4">
          <section className="card p-5">
            <p className="eyebrow">Harvest cycle</p>
            {active ? (
              <>
                <p className="display mt-2 text-[22px]">Cycle {active.cycleNumber}</p>
                <p className="text-[13px] text-muted">
                  {dateLabel(active.startDate)} → {dateLabel(active.plannedEndDate)}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-sunken" aria-hidden>
                    <div className="h-1.5 rounded-full bg-gold" style={{ width: `${Math.min(100, (cycleDays / 182) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted">
                    <span className="num">{cycleDays}</span> of 182 days
                  </span>
                </div>
                <Link href="/harvest" className="mt-4 inline-block text-[13px] font-semibold text-honey-text hover:underline">
                  Record a harvest
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                No active cycle.{" "}
                <Link href="/harvest" className="font-semibold text-honey-text hover:underline">
                  Start one
                </Link>
              </p>
            )}
          </section>

          <section className="card">
            <p className="eyebrow px-5 pt-5">Recent alerts</p>
            {alerts.length === 0 ? (
              <p className="px-5 pt-2 pb-5 text-sm text-muted">Nothing out of range recently.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {alerts.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <AlertTag state={a.state} />
                      <span className="text-xs text-faint">{dateTimeLabel(a.createdAt)}</span>
                    </div>
                    <p className={`mt-1.5 text-[13px] ${a.readAt ? "text-muted" : ""}`}>{alertMessage(a)}</p>
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
