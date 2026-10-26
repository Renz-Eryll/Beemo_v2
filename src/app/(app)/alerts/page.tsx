import type { Metadata } from "next";
import Link from "next/link";
import { markAllAlertsRead } from "@/app/actions/alerts";
import { AlertFeed, AlertItem } from "@/components/AlertFeed";
import { ConfirmButton } from "@/components/forms";
import PageHeader from "@/components/PageHeader";
import { requireSession } from "@/lib/auth";
import { listAlerts } from "@/lib/data";

export const metadata: Metadata = { title: "Alerts" };

const TZ = "Asia/Manila";
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const time = (d: Date) => d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: TZ });

function dayHeading(key: string) {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(`${key}T00:00:00+08:00`).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
}

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await requireSession();
  const unreadOnly = (await searchParams).filter === "unread";
  const alerts = await listAlerts(session.apiaryId, { unreadOnly, limit: 150 });
  const hasUnread = alerts.some((a) => !a.readAt);

  // Newest first, one block per day.
  const days = new Map<string, typeof alerts>();
  for (const a of alerts) {
    const key = dayKey(new Date(a.createdAt));
    days.set(key, [...(days.get(key) ?? []), a]);
  }

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Raised when a reading leaves the recommended range, at most once every 6 hours per condition."
        actions={
          hasUnread && (
            <ConfirmButton action={markAllAlertsRead} className="btn-outline">
              Mark all as read
            </ConfirmButton>
          )
        }
      />

      <div className="flex gap-5 border-b border-line">
        {[
          { key: "all", label: "All", href: "/alerts" },
          { key: "unread", label: "Unread", href: "/alerts?filter=unread" },
        ].map((f) => (
          <Link key={f.key} href={f.href} className={(unreadOnly ? "unread" : "all") === f.key ? "tab-active" : "tab"}>
            {f.label}
          </Link>
        ))}
      </div>

      {alerts.length === 0 ? (
        <p className="card comb-light mt-6 px-6 py-14 text-center text-sm text-muted">{unreadOnly ? "You're all caught up." : "No alerts yet."}</p>
      ) : (
        <div className="mt-6 space-y-6">
          {[...days].map(([key, items]) => (
            <section key={key} className="grid gap-x-8 gap-y-2 md:grid-cols-[9rem_minmax(0,1fr)]">
              <h2 className="flex items-baseline gap-2 md:sticky md:top-20 md:block md:self-start md:pt-3">
                <span className="display block text-[18px]">{dayHeading(key)}</span>
                <span className="text-xs text-faint md:block">
                  <span className="num">{items.length}</span> {items.length === 1 ? "alert" : "alerts"}
                </span>
              </h2>
              <div className="card px-5 py-2">
                <AlertFeed>
                  {items.map((a) => (
                    <AlertItem key={a.id} alert={a} time={time(new Date(a.createdAt))} />
                  ))}
                </AlertFeed>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
