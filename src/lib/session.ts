import { SignJWT, jwtVerify } from "jose";

// Shared by middleware (edge) and server code: no Node-only imports here.
export const SESSION_COOKIE = "beemo_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Session = {
  userId: string;
  apiaryId: string;
  role: "admin" | "worker";
  name: string;
  demo: boolean;
};

const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(value);
};

export async function signSession(session: Session) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const { userId, apiaryId, role, name, demo } = payload as Partial<Session>;
    if (!userId || !apiaryId || (role !== "admin" && role !== "worker")) return null;
    return { userId, apiaryId, role, name: name ?? "", demo: Boolean(demo) };
  } catch {
    return null;
  }
}
