import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "famlist_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — family app, low churn

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it to your .env file (see .env for how to generate one)."
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  // Mirrors User.mustChangePassword at the time the session was issued, so
  // proxy.ts can redirect to /settings without a DB round-trip. Reissue the
  // session (call createSession again) whenever the underlying flag changes,
  // or this goes stale until the cookie's natural expiry.
  mustChangePassword: boolean;
  expiresAt: number; // epoch ms
};

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(payload.expiresAt / 1000))
    .sign(getSecretKey());
}

async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Call after verifying credentials to start a logged-in session, and again
 * after changing a password to refresh the mustChangePassword flag baked
 * into the existing cookie.
 */
export async function createSession(userId: string, mustChangePassword: boolean) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = await encrypt({ userId, mustChangePassword, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

/** Reads and verifies the session cookie for the current request. Returns null if absent/invalid. */
export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}

/** Ends the current session (logout). */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
