import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { hives, readings } from "@/db/schema";
import { getSession } from "@/lib/auth";

// Raw readings as CSV for the signed-in admin's own hive.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const hiveId = params.get("hive") ?? "";
  const from = new Date(params.get("from") ?? "");
  const to = new Date(params.get("to") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(hiveId) || isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const [hive] = await db
    .select()
    .from(hives)
    .where(and(eq(hives.id, hiveId), eq(hives.apiaryId, session.apiaryId)));
  if (!hive) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select()
    .from(readings)
    .where(and(eq(readings.hiveId, hive.id), gte(readings.recordedAt, from), lte(readings.recordedAt, to)))
    .orderBy(asc(readings.recordedAt))
    .limit(100_000);

  const lines = ["recorded_at,temperature_c,humidity_pct,weight_kg", ...rows.map((r) => `${r.recordedAt.toISOString()},${r.temperature},${r.humidity},${r.weightKg}`)];
  const filename = `${hive.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${from.toISOString().slice(0, 10)}.csv`;
  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
