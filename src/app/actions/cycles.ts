"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { harvestCycles, hives } from "@/db/schema";
import { ActionError, assertCanWrite, requireSession, runAction, type ActionState } from "@/lib/auth";
import { todayIso } from "@/lib/format";

const CYCLE_DAYS = 182; // stingless bee colonies are harvested about every six months

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
const addDays = (iso: string, days: number) =>
  new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);

async function ownHive(apiaryId: string, hiveId: string) {
  const [hive] = await db
    .select({ id: hives.id })
    .from(hives)
    .where(and(eq(hives.id, hiveId), eq(hives.apiaryId, apiaryId)));
  if (!hive) throw new ActionError("Hive not found");
  return hive;
}

async function ownCycle(apiaryId: string, cycleId: string) {
  const [row] = await db
    .select({ cycle: harvestCycles })
    .from(harvestCycles)
    .innerJoin(hives, eq(harvestCycles.hiveId, hives.id))
    .where(and(eq(harvestCycles.id, cycleId), eq(hives.apiaryId, apiaryId)));
  if (!row) throw new ActionError("Cycle not found");
  return row.cycle;
}

export async function startCycle(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session, { adminOnly: true });
    const parsed = z.object({ hiveId: z.string().uuid("Choose a hive"), startDate: isoDate }).safeParse(Object.fromEntries(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const { hiveId, startDate } = parsed.data;
    if (startDate > todayIso()) return { error: "The start date can't be in the future" };

    await ownHive(session.apiaryId, hiveId);
    const [active] = await db
      .select({ id: harvestCycles.id })
      .from(harvestCycles)
      .where(and(eq(harvestCycles.hiveId, hiveId), eq(harvestCycles.status, "active")));
    if (active) return { error: "This hive already has an active cycle. Complete it first." };

    const [{ last }] = await db
      .select({ last: max(harvestCycles.cycleNumber) })
      .from(harvestCycles)
      .where(eq(harvestCycles.hiveId, hiveId));
    await db.insert(harvestCycles).values({
      hiveId,
      cycleNumber: (last ?? 0) + 1,
      startDate,
      plannedEndDate: addDays(startDate, CYCLE_DAYS),
    });
    revalidatePath("/", "layout");
    return { ok: "Cycle started" };
  });
}

export async function completeCycle(cycleId: string, _: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session, { adminOnly: true });
    const parsed = z
      .object({
        completedAt: isoDate,
        yieldKg: z.coerce.number().min(0, "Yield can't be negative").max(100),
        notes: z.string().trim().max(500).optional(),
      })
      .safeParse(Object.fromEntries(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const cycle = await ownCycle(session.apiaryId, cycleId);
    if (cycle.status === "completed") return { error: "This cycle is already complete" };
    if (parsed.data.completedAt < cycle.startDate) return { error: "Harvest date is before the cycle started" };
    if (parsed.data.completedAt > todayIso()) return { error: "The harvest date can't be in the future" };

    await db
      .update(harvestCycles)
      .set({ status: "completed", completedAt: parsed.data.completedAt, yieldKg: parsed.data.yieldKg, notes: parsed.data.notes || null })
      .where(eq(harvestCycles.id, cycle.id));
    revalidatePath("/", "layout");
    return { ok: "Harvest recorded" };
  });
}

export async function deleteCycle(cycleId: string, _: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session, { adminOnly: true });
    const cycle = await ownCycle(session.apiaryId, cycleId);
    await db.delete(harvestCycles).where(eq(harvestCycles.id, cycle.id));
    revalidatePath("/", "layout");
    return { ok: "Cycle deleted" };
  });
}
