// Clears the session cookie and sends the browser to /login. A Route
// Handler (not a Server Component) because it needs to mutate cookies —
// Next.js only allows that from Server Actions and Route Handlers. Used by
// the DAL when a session's JWT is valid but no longer points at a real
// user (deleted account, or a cookie predating a database reset): without
// clearing the cookie, that redirect loops forever against proxy.ts, which
// otherwise won't let an apparently-logged-in visitor land on /login.
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
