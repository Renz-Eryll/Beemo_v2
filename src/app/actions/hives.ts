"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { hives } from "@/db/schema";
import { assertCanWrite, requireSession, runAction, type ActionState } from "@/lib/auth";
import { generateDeviceKey } from "@/lib/device-key";

const HiveFields = z.object({
  name: z.string().trim().min(1, "Give the hive a name").max(60),
  location: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v || null),
});

export async function createHive(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session, { adminOnly: true });
    const parsed = HiveFields.safeParse({ name: form.get("name"), location: form.get("location") ?? "" });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(hives)
      .where(eq(hives.apiaryId, session.apiaryId));
    if (n >= 50) return { error: "An apiary can have up to 50 hives" };

    const [hive] = await db.insert(hives).values({ ...parsed.data, apiaryId: session.apiaryId }).returning();
    revalidatePath("/", "layout");
    redirect(`/hives/${hive.id}/device`);
  });
}

export async function updateHive(hiveId: string, _: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session, { adminOnly: true });
    const parsed = HiveFields.safeParse({ name: form.get("name"), location: form.get("location") ?? "" });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    await db
      .update(hives)
      .set(parsed.data)
      .where(and(eq(hives.id, hiveId), eq(hives.apiaryId, session.apiaryId)));
    revalidatePath("/", "layout");
    return { ok: "Saved" };
  });
}

export async function deleteHive(hiveId: string, _: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session, { adminOnly: true });
    await db.delete(hives).where(and(eq(hives.id, hiveId), eq(hives.apiaryId, session.apiaryId)));
    revalidatePath("/", "layout");
    redirect("/hives");
  });
}

// Issues a new device key. The plain key is returned once and never stored.
export type RotateKeyState = { error?: string; ok?: string; key?: string } | undefined;

export async function rotateDeviceKey(hiveId: string, _: RotateKeyState): Promise<RotateKeyState> {
  const session = await requireSession();
  try {
    assertCanWrite(session, { adminOnly: true });
  } catch (error) {
    return { error: (error as Error).message };
  }
  const { key, hash, hint } = generateDeviceKey();
  const updated = await db
    .update(hives)
    .set({ deviceKeyHash: hash, deviceKeyHint: hint })
    .where(and(eq(hives.id, hiveId), eq(hives.apiaryId, session.apiaryId)))
    .returning({ id: hives.id });
  if (!updated.length) return { error: "Hive not found" };
  revalidatePath(`/hives/${hiveId}`, "layout");
  return { ok: "New key created", key };
}
