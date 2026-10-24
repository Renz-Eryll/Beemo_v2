import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type Session } from "./session";

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "admin") redirect("/");
  return session;
}

export async function startSession(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export class ActionError extends Error {}

// The demo account is shared by every visitor, so it can look but not change anything.
export function assertCanWrite(session: Session, { adminOnly = false } = {}) {
  if (session.demo) throw new ActionError("The demo is read-only. Create a free account to make changes.");
  if (adminOnly && session.role !== "admin") throw new ActionError("Only the apiary admin can do this.");
}

export type ActionState = { error?: string; ok?: string } | undefined;

// Turn thrown ActionErrors into form state; let anything else (redirects, bugs) propagate.
export async function runAction(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? undefined;
  } catch (error) {
    if (error instanceof ActionError) return { error: error.message };
    throw error;
  }
}
