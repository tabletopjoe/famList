import { getCurrentUser } from "@/lib/auth/dal";
import { logout } from "@/app/actions/auth";
import { AppSidebar, MobileNav } from "@/components/AppNav";
import { PageTitle } from "@/components/PageTitle";
import { TopBarSlotProvider, TopBarSlotOutlet } from "@/components/TopBarSlot";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Also enforced by proxy.ts at the edge; this is the "real" check per
  // Next.js's DAL guidance, and it's what gets us the user's name for the nav.
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <TopBarSlotProvider>
        <div className="flex flex-1 flex-col">
          <header
            style={{ height: "var(--chrome-size)" }}
            className="flex items-center gap-3 overflow-hidden border-b border-white/15 px-4 text-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="shrink-0">
                <MobileNav />
              </div>
              {/* min-w-0 above lets PageTitle's `truncate` actually engage
                  when the row is too narrow, instead of pushing the row wider
                  than the viewport. */}
              <PageTitle />
              {/* Pages can drop page-specific actions here — e.g. Contacts'
                  export button — via useTopBarSlot, even though this header
                  lives above them in the layout. */}
              <div className="shrink-0">
                <TopBarSlotOutlet />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="max-w-[8rem] truncate text-white/60">{user.name}</span>
              <form action={logout}>
                <button type="submit" className="hover:underline">
                  Log out
                </button>
              </form>
            </div>
          </header>
          <main className="flex-1 px-6 py-8 md:border-l md:border-white/15">
            <div className="mx-auto w-full max-w-4xl">{children}</div>
          </main>
        </div>
      </TopBarSlotProvider>
    </div>
  );
}
