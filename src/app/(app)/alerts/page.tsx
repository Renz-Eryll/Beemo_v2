import type { Metadata } from "next";
import Link from "next/link";
import { markAllAlertsRead } from "@/app/actions/alerts";
import { ConfirmButton } from "@/components/forms";
import { AlertTag } from "@/components/Status";
import { alertMessage } from "@/lib/alerts";
import { requireSession } from "@/lib/auth";
import { listAlerts } from "@/lib/data";
import { dateTimeLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Alerts" };

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await requireSession();
  const unreadOnly = (await searchParams).filter === "unread";
  const alerts = await listAlerts(session.apiaryId, { unreadOnly, limit: 150 });
  const hasUnread = alerts.some((a) => !a.readAt);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[34px] leading-[1.05]">Alerts</h1>
          <p className="mt-2 max-w-2xl text-muted">Raised when a reading leaves the recommended range, at most once every 6 hours per condition.</p>
        </div>
        {hasUnread && (
          <ConfirmButton action={markAllAlertsRead} className="btn-outline">
            Mark all as read
          </ConfirmButton>
        )}
      </div>

      <div className="mt-6 flex gap-5 border-b border-line">
        {[
          { key: "all", label: "All", href: "/alerts" },
          { key: "unread", label: "Unread", href: "/alerts?filter=unread" },
        ].map((f) => (
          <Link
            key={f.key}
            href={f.href}
            className={(unreadOnly ? "unread" : "all") === f.key ? "tab-active" : "tab"}
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
              <span className="mt-0.5 w-16 shrink-0">
                <AlertTag state={a.state} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${a.readAt ? "text-muted" : "font-medium"}`}>{alertMessage(a)}</p>
                <p className="text-xs text-faint">
                  <Link href={`/hives/${a.hiveId}`} className="hover:text-ink">
                    {a.hiveName}
                  </Link>{" "}
                  · {dateTimeLabel(a.createdAt)}
                </p>
              </div>
              {!a.readAt && <span className="mt-0.5 shrink-0 rounded-[4px] bg-ink px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-surface uppercase">New</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
