import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";

// `proxy.ts` replaces the old `middleware.ts` convention as of Next.js 16.
// This does an *optimistic* check (cookie present and signature valid) to
// keep signed-out visitors off the app shell and signed-in users off the
// login page. It is not the last line of defense — every Server Action and
// data query still calls verifySession()/getCurrentUser() from
// `@/lib/auth/dal`, which is what actually gates access to data.

const publicRoutes = ["/login"];
// Always passes straight through, with none of the redirect rules below —
// notably not the "public route + session exists" one, since this route's
// whole job is to clear a session that LOOKS valid (signature checks out)
// but no longer points at a real user. Letting the usual rules apply to it
// would bounce it away before it ever ran.
const bypassRoutes = ["/api/force-logout"];
// The one page a user with mustChangePassword is still allowed to reach —
// everything else bounces to it until they set their own password.
const passwordChangeRoute = "/settings";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (bypassRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  const isPublicRoute = publicRoutes.includes(pathname);

  const session = await readSession();

  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session?.mustChangePassword && pathname !== passwordChangeRoute) {
    return NextResponse.redirect(new URL(passwordChangeRoute, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets, image optimization, and favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
