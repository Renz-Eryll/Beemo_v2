// Seeds the read-only demo apiary. Safe to re-run: it replaces the previous demo data.
// Usage: npm run db:seed  (reads DATABASE_URL from .env.local)
import { config } from "dotenv";
config({ path: ".env.local" });

import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { evaluateAlerts } from "../lib/alerts";
import { DEMO_EMAIL, DEMO_PROFILES } from "../lib/demo-profiles";
import { hourlySteps, simulateReading } from "../lib/simulate";

const DAY = 24 * 3_600_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

async function main() {
  const { db } = await import("./index");
  const { alerts, apiaries, harvestCycles, hives, readings, users } = await import("./schema");

  const [existing] = await db.select({ apiaryId: users.apiaryId }).from(users).where(eq(users.email, DEMO_EMAIL));
  if (existing) {
    await db.delete(apiaries).where(eq(apiaries.id, existing.apiaryId)); // cascades to everything else
    console.log("Removed previous demo apiary");
  }

  const [apiary] = await db
    .insert(apiaries)
    .values({ name: "Sariaya Meliponary", location: "Sariaya, Quezon", isDemo: true, createdAt: daysAgo(280) })
    .returning();

  // Demo passwords are random and never used: visitors enter through the demo button.
  const unusable = () => bcrypt.hash(randomBytes(32).toString("hex"), 10);
  await db.insert(users).values([
    { apiaryId: apiary.id, name: "Demo Beekeeper", email: DEMO_EMAIL, passwordHash: await unusable(), role: "admin", createdAt: daysAgo(280) },
    { apiaryId: apiary.id, name: "Joy Mercado", email: "joy.demo@beemo.app", phone: "+63 917 555 0142", passwordHash: await unusable(), role: "worker", createdAt: daysAgo(200) },
    { apiaryId: apiary.id, name: "Paolo Reyes", email: "paolo.demo@beemo.app", phone: "+63 918 555 0187", passwordHash: await unusable(), role: "worker", createdAt: daysAgo(120) },
  ]);

  const locations = ["North fence, under the kalamansi trees", "East plot, between coconut palms", "South edge, 20 m from the creek"];
  const yields = [2.9, 3.6, 2.1];
  const now = new Date();

  for (const [index, [name, profile]] of Object.entries(DEMO_PROFILES).entries()) {
    const key = "bm_" + randomBytes(24).toString("base64url");
    const [hive] = await db
      .insert(hives)
      .values({
        apiaryId: apiary.id,
        name,
        location: locations[index],
        deviceKeyHash: createHash("sha256").update(key).digest("hex"),
        deviceKeyHint: key.slice(-4),
        createdAt: daysAgo(275),
      })
      .returning();

    // Cycle 1 finished; cycle 2 started 75 days ago (6-month cycles, as in the original system).
    const firstStart = daysAgo(270);
    const activeStart = daysAgo(75 + index * 6);
    await db.insert(harvestCycles).values([
      {
        hiveId: hive.id,
        cycleNumber: 1,
        startDate: isoDate(firstStart),
        plannedEndDate: isoDate(addDays(firstStart, 182)),
        status: "completed",
        completedAt: isoDate(addDays(firstStart, 186)),
        yieldKg: yields[index],
        notes: index === 2 ? "Smaller harvest after a wet month." : null,
      },
      { hiveId: hive.id, cycleNumber: 2, startDate: isoDate(activeStart), plannedEndDate: isoDate(addDays(activeStart, 182)), status: "active" },
    ]);

    const rows = hourlySteps(daysAgo(75), now).map((at) => ({
      hiveId: hive.id,
      recordedAt: at,
      ...simulateReading({ ...profile, cycleStart: activeStart }, at),
    }));
    for (let i = 0; i < rows.length; i += 1000) await db.insert(readings).values(rows.slice(i, i + 1000));

    const recent: Parameters<typeof evaluateAlerts>[1] = [];
    const drafts = [];
    for (const row of rows) {
      const raised = evaluateAlerts(row, recent);
      recent.push(...raised);
      drafts.push(...raised);
    }
    // Older alerts were already seen; leave the last two days unread.
    const alertRows = drafts.map((d) => ({ ...d, hiveId: hive.id, readAt: d.createdAt < daysAgo(2) ? addDays(d.createdAt, 0.1) : null }));
    for (let i = 0; i < alertRows.length; i += 1000) await db.insert(alerts).values(alertRows.slice(i, i + 1000));

    await db.update(hives).set({ lastSeenAt: rows[rows.length - 1].recordedAt }).where(eq(hives.id, hive.id));
    console.log(`${name}: ${rows.length} readings, ${alertRows.length} alerts`);
  }

  console.log("Demo apiary ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
