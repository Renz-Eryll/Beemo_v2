import Link from "next/link";
import { alertMessage } from "@/lib/alerts";
import { requireSession } from "@/lib/auth";
import { listAlerts, listHives } from "@/lib/data";
import { dateLabel, isOnline, timeAgo } from "@/lib/format";
import { rangeStatus } from "@/lib/ranges";
import { MetricTile } from "@/components/Status";

export default async function OverviewPage() {
  const session = await requireSession();
  const [hives, alerts] = await Promise.all([
    listHives(session.apiaryId),
    listAlerts(session.apiaryId, { unreadOnly: true, limit: 6 }),
  ]);

  const needsAttention = hives.filter((h) => {
    const r = h.latest;
    return r && (["temperature", "humidity"] as const).some((m) => rangeStatus(m, r[m]) !== "ok");
  }).length;
  const harvestReady = hives.filter((h) => h.latest && h.latest.weightKg >= 5).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted">
            {hives.length} {hives.length === 1 ? "hive" : "hives"}
            {needsAttention > 0 && ` · ${needsAttention} outside the ideal range`}
            {harvestReady > 0 && ` · ${harvestReady} ready to harvest`}
          </p>
        </div>
        {session.role === "admin" && (
          <Link href="/hives" className="btn-outline">
            Manage hives
          </Link>
        )}
      </div>

      {hives.length === 0 ? (
        <div className="card mt-8 px-6 py-14 text-center">
          <p className="font-medium">No hives yet</p>
          <p className="mt-1 text-sm text-muted">Add a hive, then connect its sensor kit to start seeing readings.</p>
          {session.role === "admin" && (
            <Link href="/hives" className="btn-primary mt-5">
              Add your first hive
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hives.map((hive) => {
            const online = isOnline(hive.lastSeenAt);
            const cycleDays = hive.activeCycle
              ? Math.max(0, Math.round((Date.now() - new Date(hive.activeCycle.startDate).getTime()) / 86_400_000))
              : null;
            return (
              <Link key={hive.id} href={`/hives/${hive.id}`} className="card group flex flex-col p-5 transition-colors hover:border-faint">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium group-hover:underline group-hover:underline-offset-4">{hive.name}</h2>
                    <p className="truncate text-xs text-faint">{hive.location ?? "No location set"}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                    <span className={`size-2 rounded-full ${online ? "bg-good" : "bg-faint"}`} aria-hidden />
                    {online ? "Online" : hive.lastSeenAt ? `Offline · ${timeAgo(hive.lastSeenAt)}` : "Not connected"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <MetricTile metric="temperature" value={hive.latest?.temperature ?? null} />
                  <MetricTile metric="humidity" value={hive.latest?.humidity ?? null} />
                  <MetricTile metric="weight" value={hive.latest?.weightKg ?? null} />
                </div>

                <div className="mt-4 border-t border-line pt-3 text-xs text-muted">
                  {hive.activeCycle && cycleDays != null ? (
                    <>
                      <div className="flex justify-between">
                        <span>Harvest cycle {hive.activeCycle.cycleNumber}</span>
                        <span>Ends {dateLabel(hive.activeCycle.plannedEndDate)}</span>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-sunken" aria-hidden>
                        <div className="h-1 rounded-full bg-honey" style={{ width: `${Math.min(100, (cycleDays / 182) * 100)}%` }} />
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

      {alerts.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Unread alerts</h2>
            <Link href="/alerts" className="text-sm text-muted hover:text-ink">
              View all
            </Link>
          </div>
          <ul className="card mt-3 divide-y divide-line">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span
                  className={`size-2 shrink-0 rounded-full ${a.state === "high" ? "bg-high" : a.state === "low" ? "bg-low" : "bg-good"}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{alertMessage(a)}</span>
                <span className="hidden shrink-0 text-xs text-faint sm:inline">{a.hiveName}</span>
                <span className="shrink-0 text-xs text-faint">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
