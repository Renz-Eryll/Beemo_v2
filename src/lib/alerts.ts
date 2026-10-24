import type { Metric } from "@/db/schema";
import { RANGES, rangeStatus } from "./ranges";

type AlertState = "high" | "low" | "harvest";
type ReadingLike = { temperature: number; humidity: number; weightKg: number; recordedAt: Date };
export type AlertDraft = { metric: Metric; state: AlertState; value: number; createdAt: Date };
type RecentAlert = { metric: Metric; state: AlertState; createdAt: Date };

const REMINDER_MS = 6 * 60 * 60 * 1000;
const HARVEST_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // one harvest notice per week

// Decide which alerts a new reading raises. Each condition (e.g. temperature high)
// alerts at most once per REMINDER_MS, so a value hovering at a limit doesn't spam.
export function evaluateAlerts(reading: ReadingLike, recent: RecentAlert[]): AlertDraft[] {
  const drafts: AlertDraft[] = [];
  const at = reading.recordedAt.getTime();
  const firedWithin = (metric: Metric, state: AlertState, ms: number) =>
    recent.some((a) => a.metric === metric && a.state === state && at - a.createdAt.getTime() < ms);

  for (const metric of ["temperature", "humidity"] as const) {
    const status = rangeStatus(metric, reading[metric]);
    if (status === "ok") continue;
    if (!firedWithin(metric, status, REMINDER_MS)) {
      drafts.push({ metric, state: status, value: reading[metric], createdAt: reading.recordedAt });
    }
  }

  if (reading.weightKg >= RANGES.weight.max && !firedWithin("weight", "harvest", HARVEST_COOLDOWN_MS)) {
    drafts.push({ metric: "weight", state: "harvest", value: reading.weightKg, createdAt: reading.recordedAt });
  }

  return drafts;
}

export function alertMessage(a: { metric: Metric; state: AlertState; value: number }) {
  if (a.state === "harvest") return `Ready to harvest: hive weight reached ${a.value.toFixed(2)} kg`;
  const { label, unit, min, max } = RANGES[a.metric];
  return a.state === "high"
    ? `${label} above range: ${a.value.toFixed(1)}${unit} (max ${max}${unit})`
    : `${label} below range: ${a.value.toFixed(1)}${unit} (min ${min}${unit})`;
}
