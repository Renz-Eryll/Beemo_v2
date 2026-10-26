import Link from "next/link";
import type { ReactNode } from "react";
import type { Metric } from "@/db/schema";
import { alertMessage } from "@/lib/alerts";
import { HexMark } from "./Comb";
import { AlertTag } from "./Status";

type Alert = { id: string; hiveId: string; hiveName: string; metric: Metric; state: "high" | "low" | "harvest"; value: number; readAt: Date | null };

const MARK = { high: "bg-high", low: "bg-low", harvest: "bg-gold" } as const;

// Alerts on a timeline: a cell marker per alert, threaded on one line.
export function AlertFeed({ children }: { children: ReactNode }) {
  return <ol className="relative before:absolute before:top-3 before:bottom-3 before:left-[5.5px] before:w-px before:bg-line">{children}</ol>;
}

export function AlertItem({ alert, time, showHive = true }: { alert: Alert; time: string; showHive?: boolean }) {
  const unread = !alert.readAt;
  return (
    <li className="relative flex gap-4 py-2.5">
      <span className="relative mt-[5px] grid h-[15px] w-3 shrink-0 place-items-center">
        <span className="hex absolute inset-0 bg-surface" aria-hidden />
        <HexMark className={`relative ${unread ? MARK[alert.state] : "bg-line-strong"}`} size="h-[11px] w-[9px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTag state={alert.state} />
          {unread && <span className="cell-tag bg-ink py-0 text-[10px] leading-[18px] tracking-wide text-surface uppercase">New</span>}
          <span className="ml-auto text-[12px] text-faint">{time}</span>
        </div>
        <p className={`mt-1 text-[14px] ${unread ? "font-medium" : "text-muted"}`}>{alertMessage(alert)}</p>
        {showHive && (
          <Link href={`/hives/${alert.hiveId}`} className="text-[12px] text-faint hover:text-ink">
            {alert.hiveName}
          </Link>
        )}
      </div>
    </li>
  );
}
