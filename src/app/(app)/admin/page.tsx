import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { chipClass } from "@/components/chipClass";
import { getAllUsers } from "@/modules/admin/queries";
import { CreateUserForm } from "@/modules/admin/components/CreateUserForm";
import { UserManager } from "@/modules/admin/components/UserManager";
import { getContactSubmissions } from "@/modules/orbland/queries";
import { ContactSubmissionRow } from "@/modules/orbland/components/ContactSubmissionRow";

// One tab per integrated project. "Lists" is famList's own admin (accounts).
const TABS = [
  { key: "lists", label: "Lists" },
  { key: "orbland", label: "orbLand" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function parseTab(raw: string | undefined): TabKey {
  return TABS.some((t) => t.key === raw) ? (raw as TabKey) : "lists";
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const currentUser = await requireAdmin();
  const tab = parseTab((await searchParams).tab);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <nav aria-label="Admin sections" className="inline-flex rounded-full border border-foreground/15 p-0.5">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.key === "lists" ? "/admin" : `/admin?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={`${chipClass(tab === t.key)} min-w-30 justify-center`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {tab === "orbland" ? <OrbLandTab /> : <ListsTab currentUserId={currentUser.id} />}
    </div>
  );
}

async function ListsTab({ currentUserId }: { currentUserId: string }) {
  const users = await getAllUsers();
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Create a family member</h2>
        <CreateUserForm />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Manage users</h2>
        <UserManager users={users} currentUserId={currentUserId} />
      </section>
    </>
  );
}

async function OrbLandTab() {
  let submissions;
  try {
    submissions = await getContactSubmissions();
  } catch (err) {
    // e.g. a local database where orbLand's migration hasn't been run.
    console.error("[admin] loading orbland.contact_submissions failed:", err);
    return (
      <p className="text-sm text-red-500">
        Couldn&apos;t load orbLand contact submissions. Has orbLand&apos;s <code>npm run db:migrate</code> been run
        against this database?
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">
        Contact submissions <span className="text-foreground/40">({submissions.length})</span>
      </h2>
      {submissions.length === 0 ? (
        <p className="text-sm text-foreground/60">No inquiries from the schlnkr.com contact form yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <ContactSubmissionRow key={s.id} submission={s} />
          ))}
        </div>
      )}
    </section>
  );
}
