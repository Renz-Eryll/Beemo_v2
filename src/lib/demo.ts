import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { alerts, apiaries, harvestCycles, hives, readings } from "@/db/schema";
import { evaluateAlerts } from "./alerts";
import { DEMO_PROFILES } from "./demo-profiles";
import { hourlySteps, simulateReading } from "./simulate";

const MAX_BACKFILL_MS = 14 * 24 * 3_600_000;

// Fill the demo hives' readings up to now so the demo always looks live.
export async function topUpDemoReadings(apiaryId: string) {
  const [apiary] = await db.select().from(apiaries).where(eq(apiaries.id, apiaryId));
  if (!apiary?.isDemo) return;

  const demoHives = await db.select().from(hives).where(eq(hives.apiaryId, apiaryId));
  const now = new Date();

  for (const hive of demoHives) {
    const profile = DEMO_PROFILES[hive.name];
    if (!profile) continue;

    const [last] = await db
      .select({ at: readings.recordedAt })
      .from(readings)
      .where(eq(readings.hiveId, hive.id))
      .orderBy(desc(readings.recordedAt))
      .limit(1);
    const from = new Date(Math.max(last?.at.getTime() ?? 0, now.getTime() - MAX_BACKFILL_MS));
    const steps = hourlySteps(from, now);
    if (steps.length === 0) continue;

    const [cycle] = await db
      .select()
      .from(harvestCycles)
      .where(and(eq(harvestCycles.hiveId, hive.id), eq(harvestCycles.status, "active")));
    const cycleStart = cycle ? new Date(cycle.startDate) : new Date(now.getTime() - 60 * 24 * 3_600_000);

    const rows = steps.map((at) => ({ hiveId: hive.id, recordedAt: at, ...simulateReading({ ...profile, cycleStart }, at) }));
    const recent = await db
      .select({ metric: alerts.metric, state: alerts.state, createdAt: alerts.createdAt })
      .from(alerts)
      .where(and(eq(alerts.hiveId, hive.id), gte(alerts.createdAt, new Date(from.getTime() - 24 * 3_600_000))));

    const newAlerts = [];
    for (const row of rows) {
      const drafts = evaluateAlerts(row, recent);
      recent.push(...drafts);
      newAlerts.push(...drafts.map((d) => ({ ...d, hiveId: hive.id })));
    }

    // Concurrent page loads may race; the (hive, time) unique index makes this idempotent.
    await db.insert(readings).values(rows).onConflictDoNothing();
    if (newAlerts.length) await db.insert(alerts).values(newAlerts);
    await db.update(hives).set({ lastSeenAt: rows[rows.length - 1].recordedAt }).where(eq(hives.id, hive.id));
  }
}
