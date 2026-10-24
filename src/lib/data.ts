import "server-only";
import { notFound } from "next/navigation";
import { and, asc, count, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { alerts, apiaries, harvestCycles, hives, readings, users, type Reading } from "@/db/schema";

// Every query takes the session's apiaryId, so one apiary can never read another's data.

export async function getApiary(apiaryId: string) {
  const [apiary] = await db.select().from(apiaries).where(eq(apiaries.id, apiaryId));
  return apiary;
}

export async function listHives(apiaryId: string) {
  const rows = await db.select().from(hives).where(eq(hives.apiaryId, apiaryId)).orderBy(asc(hives.createdAt));
  if (rows.length === 0) return [];

  // Latest reading per hive in one query.
  const latest = await db
    .selectDistinctOn([readings.hiveId])
    .from(readings)
    .where(inArray(readings.hiveId, rows.map((h) => h.id)))
    .orderBy(readings.hiveId, desc(readings.recordedAt));
  const byHive = new Map(latest.map((r) => [r.hiveId, r]));

  const active = await db
    .select()
    .from(harvestCycles)
    .where(and(inArray(harvestCycles.hiveId, rows.map((h) => h.id)), eq(harvestCycles.status, "active")));
  const cycleByHive = new Map(active.map((c) => [c.hiveId, c]));

  return rows.map((hive) => ({ ...hive, latest: byHive.get(hive.id) ?? null, activeCycle: cycleByHive.get(hive.id) ?? null }));
}

export async function getHive(apiaryId: string, hiveId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(hiveId)) notFound();
  const [hive] = await db
    .select()
    .from(hives)
    .where(and(eq(hives.id, hiveId), eq(hives.apiaryId, apiaryId)));
  if (!hive) notFound();
  return hive;
}

export async function latestReading(hiveId: string) {
  const [row] = await db
    .select()
    .from(readings)
    .where(eq(readings.hiveId, hiveId))
    .orderBy(desc(readings.recordedAt))
    .limit(1);
  return row ?? null;
}

export type SeriesPoint = { t: number; temperature: number; humidity: number; weightKg: number };

// Readings averaged into buckets so long ranges stay light (hourly for a day, daily for 90 days).
export async function readingSeries(hiveId: string, since: Date, bucketMinutes: number): Promise<SeriesPoint[]> {
  const bucket = sql`date_bin(${`${bucketMinutes} minutes`}::interval, ${readings.recordedAt}, timestamptz '2000-01-01')`;
  const rows = await db
    .select({
      t: sql<string>`${bucket}`,
      temperature: sql<number>`avg(${readings.temperature})::real`,
      humidity: sql<number>`avg(${readings.humidity})::real`,
      weightKg: sql<number>`avg(${readings.weightKg})::real`,
    })
    .from(readings)
    .where(and(eq(readings.hiveId, hiveId), gte(readings.recordedAt, since)))
    // Group/order by position: repeating the expression would bind the interval as separate parameters.
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((r) => ({
    t: new Date(r.t).getTime(),
    temperature: Number(r.temperature),
    humidity: Number(r.humidity),
    weightKg: Number(r.weightKg),
  }));
}

export async function periodStats(hiveId: string, from: Date, to: Date) {
  const where = and(eq(readings.hiveId, hiveId), gte(readings.recordedAt, from), sql`${readings.recordedAt} <= ${to}`);
  const [agg] = await db
    .select({
      count: sql<number>`count(*)::int`,
      tAvg: sql<number>`avg(${readings.temperature})`,
      tMin: sql<number>`min(${readings.temperature})`,
      tMax: sql<number>`max(${readings.temperature})`,
      hAvg: sql<number>`avg(${readings.humidity})`,
      hMin: sql<number>`min(${readings.humidity})`,
      hMax: sql<number>`max(${readings.humidity})`,
      wMin: sql<number>`min(${readings.weightKg})`,
      wMax: sql<number>`max(${readings.weightKg})`,
    })
    .from(readings)
    .where(where);
  const edge = async (dir: "asc" | "desc") => {
    const [r] = await db
      .select({ w: readings.weightKg })
      .from(readings)
      .where(where)
      .orderBy(dir === "asc" ? asc(readings.recordedAt) : desc(readings.recordedAt))
      .limit(1);
    return r?.w ?? 0;
  };
  const [start, end] = await Promise.all([edge("asc"), edge("desc")]);
  const n = (v: unknown) => Number(v ?? 0);
  return {
    count: n(agg?.count),
    temperature: { avg: n(agg?.tAvg), min: n(agg?.tMin), max: n(agg?.tMax) },
    humidity: { avg: n(agg?.hAvg), min: n(agg?.hMin), max: n(agg?.hMax) },
    weight: { start, end, min: n(agg?.wMin), max: n(agg?.wMax) },
  };
}

export async function listCycles(apiaryId: string, hiveId?: string) {
  const rows = await db
    .select({ cycle: harvestCycles, hiveName: hives.name })
    .from(harvestCycles)
    .innerJoin(hives, eq(harvestCycles.hiveId, hives.id))
    .where(and(eq(hives.apiaryId, apiaryId), hiveId ? eq(hives.id, hiveId) : undefined))
    .orderBy(asc(hives.name), desc(harvestCycles.cycleNumber));
  return rows.map((r) => ({ ...r.cycle, hiveName: r.hiveName }));
}

export async function listAlerts(apiaryId: string, { unreadOnly = false, hiveId, limit = 100 } = {} as {
  unreadOnly?: boolean;
  hiveId?: string;
  limit?: number;
}) {
  const rows = await db
    .select({ alert: alerts, hiveName: hives.name })
    .from(alerts)
    .innerJoin(hives, eq(alerts.hiveId, hives.id))
    .where(
      and(eq(hives.apiaryId, apiaryId), unreadOnly ? isNull(alerts.readAt) : undefined, hiveId ? eq(hives.id, hiveId) : undefined),
    )
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.alert, hiveName: r.hiveName }));
}

export async function unreadAlertCount(apiaryId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(alerts)
    .innerJoin(hives, eq(alerts.hiveId, hives.id))
    .where(and(eq(hives.apiaryId, apiaryId), isNull(alerts.readAt)));
  return row?.n ?? 0;
}

export async function listMembers(apiaryId: string) {
  return db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.apiaryId, apiaryId))
    .orderBy(asc(users.role), asc(users.createdAt));
}

export type { Reading };
