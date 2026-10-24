"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { alerts, hives } from "@/db/schema";
import { assertCanWrite, requireSession, runAction, type ActionState } from "@/lib/auth";

export async function markAllAlertsRead(_: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session);
    const own = db.select({ id: hives.id }).from(hives).where(eq(hives.apiaryId, session.apiaryId));
    await db
      .update(alerts)
      .set({ readAt: new Date() })
      .where(and(inArray(alerts.hiveId, own), isNull(alerts.readAt)));
    revalidatePath("/", "layout");
    return { ok: "All caught up" };
  });
}
