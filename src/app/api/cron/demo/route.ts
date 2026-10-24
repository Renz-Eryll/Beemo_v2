import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiaries } from "@/db/schema";
import { topUpDemoReadings } from "@/lib/demo";

// Daily Vercel Cron (see vercel.json): keeps the demo apiary's readings current.
// Vercel sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const demos = await db.select({ id: apiaries.id }).from(apiaries).where(eq(apiaries.isDemo, true));
  for (const { id } of demos) await topUpDemoReadings(id);
  return NextResponse.json({ ok: true, apiaries: demos.length });
}
