import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { modules } from "@/modules/registry";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((mod) => (
          <Link
            key={mod.key}
            href={mod.href}
            className="rounded-lg border border-foreground/10 p-5 transition hover:border-foreground/30 dark:border-foreground/15 dark:hover:border-foreground/40"
          >
            <p className="text-lg font-medium">
              {mod.icon} {mod.name}
            </p>
            <p className="mt-1 text-sm text-foreground/60">{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
