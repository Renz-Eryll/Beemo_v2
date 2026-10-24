"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { apiaries, users } from "@/db/schema";
import { endSession, startSession, type ActionState } from "@/lib/auth";
import { DEMO_EMAIL } from "@/lib/demo-profiles";

// Compared against when the email doesn't exist, so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
};

const Login = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = Login.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [user] = await db
    .select({ user: users, isDemo: apiaries.isDemo })
    .from(users)
    .innerJoin(apiaries, eq(users.apiaryId, apiaries.id))
    .where(eq(users.email, parsed.data.email));

  const valid = (await bcrypt.compare(parsed.data.password, user?.user.passwordHash ?? DUMMY_HASH)) && user && !user.isDemo;
  if (!valid) return { error: "Incorrect email or password" };

  await startSession({
    userId: user.user.id,
    apiaryId: user.user.apiaryId,
    role: user.user.role,
    name: user.user.name,
    demo: false,
  });
  redirect(safeNext(form.get("next")));
}

const Signup = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  apiary: z.string().trim().min(2, "Name your apiary").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export async function signup(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = Signup.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, apiary, email, password } = parsed.data;

  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (taken) return { error: "An account with this email already exists" };

  const [created] = await db.insert(apiaries).values({ name: apiary }).returning();
  const [user] = await db
    .insert(users)
    .values({ apiaryId: created.id, name, email, passwordHash: await bcrypt.hash(password, 10), role: "admin" })
    .returning();

  await startSession({ userId: user.id, apiaryId: created.id, role: "admin", name, demo: false });
  redirect("/hives?welcome=1");
}

export async function startDemo() {
  const [demo] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL));
  if (!demo) redirect("/login?error=demo");
  await startSession({ userId: demo.id, apiaryId: demo.apiaryId, role: "admin", name: demo.name, demo: true });
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
