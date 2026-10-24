import type { Metadata } from "next";
import Link from "next/link";
import { markAllAlertsRead } from "@/app/actions/alerts";
import { ConfirmButton } from "@/components/forms";
import { alertMessage } from "@/lib/alerts";
import { requireSession } from "@/lib/auth";
import { listAlerts } from "@/lib/data";
import { dateTimeLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Alerts" };

const STATE_STYLE = {
  high: { dot: "bg-high", label: "Above range" },
  low: { dot: "bg-low", label: "Below range" },
  harvest: { dot: "bg-good", label: "Harvest" },
} as const;

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await requireSession();
  const unreadOnly = (await searchParams).filter === "unread";
  const alerts = await listAlerts(session.apiaryId, { unreadOnly, limit: 150 });
  const hasUnread = alerts.some((a) => !a.readAt);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-muted">Raised when a reading leaves the recommended range, at most once every 6 hours per condition.</p>
        </div>
        {hasUnread && (
          <ConfirmButton action={markAllAlertsRead} className="btn-outline">
            Mark all as read
          </ConfirmButton>
        )}
      </div>

      <div className="mt-6 flex gap-1">
        {[
          { key: "all", label: "All", href: "/alerts" },
          { key: "unread", label: "Unread", href: "/alerts?filter=unread" },
        ].map((f) => (
          <Link
            key={f.key}
            href={f.href}
            className={`rounded-full px-3 py-1 text-sm ${(unreadOnly ? "unread" : "all") === f.key ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {alerts.length === 0 ? (
        <p className="card mt-4 px-6 py-12 text-center text-sm text-muted">{unreadOnly ? "You're all caught up." : "No alerts yet."}</p>
      ) : (
        <ul className="card mt-4 divide-y divide-line">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${STATE_STYLE[a.state].dot}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${a.readAt ? "text-muted" : "font-medium"}`}>{alertMessage(a)}</p>
                <p className="text-xs text-faint">
                  <Link href={`/hives/${a.hiveId}`} className="hover:text-ink">
                    {a.hiveName}
                  </Link>{" "}
                  · {STATE_STYLE[a.state].label} · {dateTimeLabel(a.createdAt)}
                </p>
              </div>
              {!a.readAt && <span className="mt-1 shrink-0 rounded bg-honey-soft px-1.5 py-0.5 text-[11px] font-medium">New</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
