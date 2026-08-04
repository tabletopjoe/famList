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

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);

  const session = await readSession();

  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets, image optimization, and favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
