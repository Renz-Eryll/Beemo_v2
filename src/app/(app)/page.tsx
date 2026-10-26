import Link from "next/link";
import { AlertFeed, AlertItem } from "@/components/AlertFeed";
import { ApiaryComb, CYCLE_DAYS, CombMeter, HexMark, hiveCondition } from "@/components/Comb";
import PageHeader, { SectionTitle } from "@/components/PageHeader";
import { MetricTile } from "@/components/Status";
import { requireSession } from "@/lib/auth";
import { getApiary, listAlerts, listHives, unreadAlertCount } from "@/lib/data";
import { dateLabel, isOnline, timeAgo } from "@/lib/format";
import { rangeStatus } from "@/lib/ranges";

const greeting = () => {
  const hour = (new Date().getUTCHours() + 8) % 24;
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

const CARD_EDGE = { high: "border-t-high", low: "border-t-low", ok: "border-t-honey-2" } as const;

export default async function OverviewPage() {
  const session = await requireSession();
  const [apiary, hives, alerts, unread] = await Promise.all([
    getApiary(session.apiaryId),
    listHives(session.apiaryId),
    listAlerts(session.apiaryId, { unreadOnly: true, limit: 6 }),
    unreadAlertCount(session.apiaryId),
  ]);

  const online = hives.filter((h) => isOnline(h.lastSeenAt)).length;
  const needsAttention = hives.filter((h) => {
    const r = h.latest;
    return r && (["temperature", "humidity"] as const).some((m) => rangeStatus(m, r[m]) !== "ok");
  }).length;
  const harvestReady = hives.filter((h) => h.latest && h.latest.weightKg >= 5).length;
  const firstName = session.name.split(" ")[0];

  const combHives = hives.map((h) => ({ id: h.id, name: h.name, online: isOnline(h.lastSeenAt), latest: h.latest }));
  const addHref = session.role === "admin" ? "/hives" : undefined;
  const stats = [
    { label: "Hives online", value: `${online}/${hives.length}`, hint: online === hives.length ? "All sensor kits reporting" : "Some kits are offline", tone: "" },
    { label: "Outside range", value: needsAttention, hint: "Temperature or humidity", tone: needsAttention ? "text-high-bright" : "" },
    { label: "Ready to harvest", value: harvestReady, hint: "Hive weight at 5 kg or more", tone: harvestReady ? "text-honey" : "" },
    { label: "Unread alerts", value: unread, hint: "Across all hives", tone: "" },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`${apiary?.name ?? "Your apiary"}${apiary?.location ? ` · ${apiary.location}` : ""}`}
        title={`${greeting()}, ${firstName}`}
        actions={
          session.role === "admin" && (
            <Link href="/hives" className="btn-outline">
              Manage hives
            </Link>
          )
        }
      />

      <section className="hero grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_14rem]" aria-labelledby="comb-title">
        <div className="min-w-0">
          <h2 id="comb-title" className="display text-[20px] text-honey">
            The comb
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-rail-muted">
            Each cell is a hive. Honey rises with its weight toward 5 kg; the edge shows its temperature and humidity.
          </p>
          <div className="mt-6 sm:hidden">
            <ApiaryComb hives={combHives} columns={3} addHref={addHref} />
          </div>
          <div className="mt-6 hidden sm:block">
            <ApiaryComb hives={combHives} columns={6} addHref={addHref} />
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-rail-muted">
            <li className="flex items-center gap-2">
              <HexMark className="bg-honey-2" /> In range
            </li>
            <li className="flex items-center gap-2">
              <HexMark className="bg-high-bright" /> Too high
            </li>
            <li className="flex items-center gap-2">
              <HexMark className="bg-low-bright" /> Too low
            </li>
            <li className="flex items-center gap-2">
              <HexMark className="bg-gold" /> Full cell: ready to harvest
            </li>
          </ul>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-rail-line pt-6 lg:grid-cols-1 lg:content-center lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0">
              <dt className="eyebrow text-rail-muted">{s.label}</dt>
              <dd className={`num mt-1 text-[26px] leading-none font-medium sm:text-[30px] ${s.tone}`}>{s.value}</dd>
              <p className="mt-1 truncate text-[12px] text-rail-muted">{s.hint}</p>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <SectionTitle>Hives</SectionTitle>
        {hives.length === 0 ? (
          <div className="card comb-light px-6 py-14 text-center">
            <p className="font-semibold">No hives yet</p>
            <p className="mt-1 text-sm text-muted">Add a hive, then connect its sensor kit to start seeing readings.</p>
            {session.role === "admin" && (
              <Link href="/hives" className="btn-honey mt-5">
                Add your first hive
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4">
            {hives.map((hive) => {
              const live = isOnline(hive.lastSeenAt);
              const condition = live ? hiveCondition(hive.latest) : null;
              const cycleDays = hive.activeCycle
                ? Math.max(0, Math.round((Date.now() - new Date(hive.activeCycle.startDate).getTime()) / 86_400_000))
                : null;
              return (
                <Link
                  key={hive.id}
                  href={`/hives/${hive.id}`}
                  className={`card group flex flex-col border-t-[3px] transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(36,33,28,0.25)] ${
                    condition ? CARD_EDGE[condition] : "border-t-line-strong"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                    <div className="min-w-0">
                      <h3 className="display truncate text-[18px] group-hover:text-honey-text">{hive.name}</h3>
                      <p className="truncate text-xs text-faint">{hive.location ?? "No location set"}</p>
                    </div>
                    <span className={`cell-tag ${live ? "bg-good-soft text-good" : "bg-sunken text-muted"}`}>
                      <span className={`size-1.5 rounded-full ${live ? "bg-good" : "bg-faint"}`} aria-hidden />
                      {live ? "Online" : hive.lastSeenAt ? timeAgo(hive.lastSeenAt) : "Not connected"}
                    </span>
                  </div>

                  <div className="space-y-3.5 px-5 pt-1 pb-5">
                    <MetricTile metric="temperature" value={hive.latest?.temperature ?? null} />
                    <MetricTile metric="humidity" value={hive.latest?.humidity ?? null} />
                    <MetricTile metric="weight" value={hive.latest?.weightKg ?? null} />
                  </div>

                  <div className="mt-auto border-t border-line bg-paper/60 px-5 py-3.5 text-xs text-muted">
                    {hive.activeCycle && cycleDays != null ? (
                      <>
                        <div className="mb-2 flex justify-between gap-2">
                          <span>
                            Cycle {hive.activeCycle.cycleNumber} · day <span className="num text-ink">{cycleDays}</span> of {CYCLE_DAYS}
                          </span>
                          <span>Ends {dateLabel(hive.activeCycle.plannedEndDate)}</span>
                        </div>
                        <CombMeter days={cycleDays} />
                      </>
                    ) : (
                      <span>No active harvest cycle</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {alerts.length > 0 && (
        <section className="mt-12">
          <SectionTitle
            aside={
              <Link href="/alerts" className="text-[13px] font-semibold text-honey-text hover:underline">
                View all
              </Link>
            }
          >
            Unread alerts
          </SectionTitle>
          <div className="card px-5 py-3">
            <AlertFeed>
              {alerts.map((a) => (
                <AlertItem key={a.id} alert={a} time={timeAgo(a.createdAt)} />
              ))}
            </AlertFeed>
          </div>
        </section>
      )}
    </>
  );
}
