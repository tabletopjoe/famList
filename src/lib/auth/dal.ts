import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

/**
 * Data Access Layer entry point. Verifies the session cookie and redirects
 * to /login if it's missing/invalid. Memoized per-request with React's
 * `cache` so calling this from multiple components doesn't re-verify
 * repeatedly. Call this at the top of any Server Action, Route Handler, or
 * data-fetching function that requires a logged-in user — per the Next.js
 * auth guide, don't rely on layout-level checks alone since layouts don't
 * re-run on client-side navigations.
 */
export const verifySession = cache(async () => {
  const session = await readSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return { userId: session.userId };
});

/** Same as verifySession but returns null instead of redirecting. Use for optional auth (e.g. nav that shows login/logout). */
export const getOptionalSession = cache(async () => {
  const session = await readSession();
  return session?.userId ? { userId: session.userId } : null;
});

/** Fetches the current user's safe-to-expose fields (never the password hash). */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, mustChangePassword: true, primaryListId: true },
  });
  if (!user) {
    // The JWT is valid but no longer points at a real row (deleted user, or
    // a cookie that predates a database reset). A plain redirect isn't
    // enough — proxy.ts sees the (still-valid) session and won't let an
    // apparently-logged-in visitor land on /login, so without clearing the
    // cookie this bounces forever. Server Components can't mutate cookies
    // themselves, so route through /api/force-logout, which can.
    redirect("/api/force-logout");
  }
  return user;
});
