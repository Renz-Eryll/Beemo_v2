import Link from "next/link";
import PageHeader, { SectionTitle, StatStrip } from "@/components/PageHeader";
import { AlertTag, MetricTile } from "@/components/Status";
import { alertMessage } from "@/lib/alerts";
import { requireSession } from "@/lib/auth";
import { getApiary, listAlerts, listHives, unreadAlertCount } from "@/lib/data";
import { dateLabel, isOnline, timeAgo } from "@/lib/format";
import { rangeStatus } from "@/lib/ranges";

const greeting = () => {
  const hour = (new Date().getUTCHours() + 8) % 24;
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

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

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={`${apiary?.name ?? "Your apiary"}${apiary?.location ? ` · ${apiary.location}` : ""}`}
        actions={
          session.role === "admin" && (
            <Link href="/hives" className="btn-outline">
              Manage hives
            </Link>
          )
        }
      />

      <StatStrip
        items={[
          { label: "Hives online", value: `${online}/${hives.length}`, hint: online === hives.length ? "All sensor kits reporting" : "Some kits are offline" },
          { label: "Outside range", value: needsAttention, hint: "Temperature or humidity", tone: needsAttention ? "warn" : "default" },
          { label: "Ready to harvest", value: harvestReady, hint: "Hive weight at 5 kg or more", tone: harvestReady ? "good" : "default" },
          { label: "Unread alerts", value: unread, hint: "Across all hives" },
        ]}
      />

      <section className="mt-10">
        <SectionTitle>Hives</SectionTitle>
        {hives.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="font-semibold">No hives yet</p>
            <p className="mt-1 text-sm text-muted">Add a hive, then connect its sensor kit to start seeing readings.</p>
            {session.role === "admin" && (
              <Link href="/hives" className="btn-honey mt-5">
                Add your first hive
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hives.map((hive) => {
              const live = isOnline(hive.lastSeenAt);
              const cycleDays = hive.activeCycle
                ? Math.max(0, Math.round((Date.now() - new Date(hive.activeCycle.startDate).getTime()) / 86_400_000))
                : null;
              return (
                <Link key={hive.id} href={`/hives/${hive.id}`} className="card group flex flex-col transition-colors hover:border-line-strong">
                  <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold group-hover:underline group-hover:underline-offset-4">{hive.name}</h3>
                      <p className="truncate text-xs text-faint">{hive.location ?? "No location set"}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                      <span className={`size-2 rounded-full ${live ? "bg-good" : "bg-line-strong"}`} aria-hidden />
                      {live ? "Online" : hive.lastSeenAt ? timeAgo(hive.lastSeenAt) : "Not connected"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 px-5 py-4">
                    <MetricTile metric="temperature" value={hive.latest?.temperature ?? null} />
                    <MetricTile metric="humidity" value={hive.latest?.humidity ?? null} />
                    <MetricTile metric="weight" value={hive.latest?.weightKg ?? null} />
                  </div>

                  <div className="mt-auto border-t border-line px-5 py-3 text-xs text-muted">
                    {hive.activeCycle && cycleDays != null ? (
                      <>
                        <div className="flex justify-between">
                          <span>
                            Cycle {hive.activeCycle.cycleNumber} · day <span className="num">{cycleDays}</span> of 182
                          </span>
                          <span>Ends {dateLabel(hive.activeCycle.plannedEndDate)}</span>
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-sunken" aria-hidden>
                          <div className="h-1 rounded-full bg-gold" style={{ width: `${Math.min(100, (cycleDays / 182) * 100)}%` }} />
                        </div>
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
        <section className="mt-10">
          <SectionTitle
            aside={
              <Link href="/alerts" className="text-[13px] font-semibold text-honey-text hover:underline">
                View all
              </Link>
            }
          >
            Unread alerts
          </SectionTitle>
          <ul className="card divide-y divide-line">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <AlertTag state={a.state} />
                <span className="min-w-0 flex-1 truncate">{alertMessage(a)}</span>
                <span className="hidden shrink-0 text-xs text-muted sm:inline">{a.hiveName}</span>
                <span className="w-20 shrink-0 text-right text-xs text-faint">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
