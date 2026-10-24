"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { assertCanWrite, requireSession, runAction, type ActionState } from "@/lib/auth";

const Worker = z.object({
  name: z.string().trim().min(2, "Enter the worker's name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .max(30)
    .transform((v) => v || null),
  password: z.string().min(8, "Temporary password needs at least 8 characters").max(200),
});

// Admins add workers directly with a temporary password they share in person.
export async function addWorker(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session, { adminOnly: true });
    const parsed = Worker.safeParse({ ...Object.fromEntries(form), phone: form.get("phone") ?? "" });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email));
    if (taken) return { error: "That email is already in use" };

    const { password, ...fields } = parsed.data;
    await db.insert(users).values({
      ...fields,
      apiaryId: session.apiaryId,
      role: "worker",
      passwordHash: await bcrypt.hash(password, 10),
    });
    revalidatePath("/workers");
    return { ok: `${fields.name} can now sign in` };
  });
}

export async function removeWorker(userId: string, _: ActionState): Promise<ActionState> {
  return runAction(async () => {
    const session = await requireSession();
    assertCanWrite(session, { adminOnly: true });
    // Only workers can be removed, and only from the admin's own apiary.
    await db
      .delete(users)
      .where(and(eq(users.id, userId), eq(users.apiaryId, session.apiaryId), eq(users.role, "worker")));
    revalidatePath("/workers");
    return { ok: "Worker removed" };
  });
}
