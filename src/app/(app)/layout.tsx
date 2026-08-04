import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { modules } from "@/modules/registry";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Also enforced by proxy.ts at the edge; this is the "real" check per
  // Next.js's DAL guidance, and it's what gets us the user's name for the nav.
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-black/10 dark:border-white/15">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            famList
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {modules.map((mod) => (
              <Link key={mod.key} href={mod.href} className="hover:underline">
                {mod.icon} {mod.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-black/60 dark:text-white/60">{user.name}</span>
            <form action={logout}>
              <button type="submit" className="hover:underline">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
