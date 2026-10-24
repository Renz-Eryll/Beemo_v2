import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { alerts, hives, readings } from "@/db/schema";
import { evaluateAlerts } from "@/lib/alerts";
import { hashDeviceKey, looksLikeDeviceKey } from "@/lib/device-key";
import { SENSOR_BOUNDS, rangeStatus } from "@/lib/ranges";

// Sensor ingest for the ESP8266: POST /api/ingest
//   Authorization: Bearer <device key>
//   { "temperature": 33.4, "humidity": 55.2, "weight": 2.31 }

const MIN_INTERVAL_MS = 10_000; // devices report every minute or so; reject floods

const bounded = (metric: keyof typeof SENSOR_BOUNDS) =>
  z.number().finite().min(SENSOR_BOUNDS[metric][0]).max(SENSOR_BOUNDS[metric][1]);

const Body = z.object({
  temperature: bounded("temperature"),
  humidity: bounded("humidity"),
  weight: bounded("weight"),
});

const error = (status: number, message: string) => NextResponse.json({ ok: false, error: message }, { status });

export async function POST(req: NextRequest) {
  const key = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!looksLikeDeviceKey(key)) return error(401, "Missing or malformed device key");

  const [hive] = await db.select().from(hives).where(eq(hives.deviceKeyHash, hashDeviceKey(key)));
  if (!hive) return error(401, "Unknown device key");

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return error(422, parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));
  }

  const now = new Date();
  const [last] = await db
    .select({ at: readings.recordedAt })
    .from(readings)
    .where(eq(readings.hiveId, hive.id))
    .orderBy(desc(readings.recordedAt))
    .limit(1);
  if (last && now.getTime() - last.at.getTime() < MIN_INTERVAL_MS) {
    return error(429, "Too many readings; send at most one every 10 seconds");
  }

  const reading = {
    hiveId: hive.id,
    temperature: parsed.data.temperature,
    humidity: parsed.data.humidity,
    weightKg: parsed.data.weight,
    recordedAt: now,
  };

  const recent = await db
    .select({ metric: alerts.metric, state: alerts.state, createdAt: alerts.createdAt })
    .from(alerts)
    .where(and(eq(alerts.hiveId, hive.id), gte(alerts.createdAt, new Date(now.getTime() - 7 * 24 * 3_600_000))));
  const raised = evaluateAlerts(reading, recent);

  await db.insert(readings).values(reading);
  if (raised.length) await db.insert(alerts).values(raised.map((a) => ({ ...a, hiveId: hive.id })));
  await db.update(hives).set({ lastSeenAt: now }).where(eq(hives.id, hive.id));

  // The response tells the device which actuators to run (heater, cooler, fan).
  return NextResponse.json(
    {
      ok: true,
      status: {
        temperature: rangeStatus("temperature", reading.temperature),
        humidity: rangeStatus("humidity", reading.humidity),
        weight: rangeStatus("weight", reading.weightKg),
      },
      alerts: raised.length,
    },
    { status: 201 },
  );
}
