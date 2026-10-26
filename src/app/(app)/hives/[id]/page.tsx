import type { Metadata } from "next";
import Link from "next/link";
import { AlertFeed, AlertItem } from "@/components/AlertFeed";
import { CYCLE_DAYS, CombMeter, HexMark, HoneyCell } from "@/components/Comb";
import MetricChart from "@/components/MetricChart";
import PageHeader from "@/components/PageHeader";
import { MetricTile } from "@/components/Status";
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
        eyebrow={hive.location ?? "Hive"}
        title={hive.name}
        description={
          <span className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${online ? "bg-good" : "bg-line-strong"}`} aria-hidden />
            {latest ? `Last reading ${timeAgo(latest.recordedAt)}` : "Waiting for the first reading"}
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

      <section className="hero grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[11rem_1fr]" aria-label="Latest reading">
        <div className="@container relative mx-auto aspect-[1/0.866] w-40 sm:w-44">
          <HoneyCell hive={{ id: hive.id, name: hive.name, online, latest }} large />
        </div>
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rail-line">
          {(["temperature", "humidity", "weight"] as const).map((m, i) => (
            <div key={m} className={i === 0 ? "sm:pr-6" : i === 1 ? "sm:px-6" : "sm:pl-6"}>
              <MetricTile metric={m} value={latest ? (m === "weight" ? latest.weightKg : latest[m]) : null} size="lg" />
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <h2 className="display flex items-center gap-2.5 pb-2.5 text-[18px]">
          <HexMark className="bg-honey-2" size="size-3" />
          History
        </h2>
        <div role="tablist" aria-label="Time range" className="-mb-px flex max-w-full gap-5 overflow-x-auto">
          {(Object.keys(SPANS) as Span[]).map((key) => (
            <Link key={key} role="tab" aria-selected={span === key} href={`?range=${key}`} scroll={false} className={span === key ? "tab-active" : "tab"}>
              {SPANS[key].label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <MetricChart metric="temperature" data={series} span={span} />
          <MetricChart metric="humidity" data={series} span={span} />
          <MetricChart metric="weight" data={series} span={span} />
        </div>

        <div className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
          <section className="card comb-light p-5">
            <p className="eyebrow">Harvest cycle</p>
            {active ? (
              <>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <p className="display text-[24px]">Cycle {active.cycleNumber}</p>
                  <p className="text-xs text-muted">
                    Week <span className="num text-ink">{Math.min(26, Math.floor(cycleDays / 7) + 1)}</span> of 26
                  </p>
                </div>
                <p className="text-[13px] text-muted">
                  {dateLabel(active.startDate)} → {dateLabel(active.plannedEndDate)}
                </p>
                <div className="mt-4">
                  <CombMeter days={cycleDays} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  <span className="num text-ink">{cycleDays}</span> of {CYCLE_DAYS} days
                </p>
                <Link href="/harvest" className="btn-honey mt-4">
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

          <section className="card p-5">
            <p className="eyebrow">Recent alerts</p>
            {alerts.length === 0 ? (
              <p className="pt-2 text-sm text-muted">Nothing out of range recently.</p>
            ) : (
              <div className="mt-2">
                <AlertFeed>
                  {alerts.map((a) => (
                    <AlertItem key={a.id} alert={a} time={dateTimeLabel(a.createdAt)} showHive={false} />
                  ))}
                </AlertFeed>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
