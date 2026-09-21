import Link from "next/link";
import { TreePine } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getOwnedListsWithShares } from "@/modules/lists/queries";
import { getVisibleContactOwnerIds } from "@/modules/contacts/queries";
import { getOtherUsers } from "@/modules/settings/queries";
import { ChangePasswordForm } from "@/modules/settings/components/ChangePasswordForm";
import { ListSharingSection } from "@/modules/settings/components/ListSharingSection";
import { ContactSharingSection } from "@/modules/settings/components/ContactSharingSection";
import { ThemePicker } from "@/modules/settings/components/ThemePicker";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { parseTheme, parseThemeMode } from "@/lib/themes";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [otherUsers, ownedLists, visibleContactOwnerIds] = await Promise.all([
    getOtherUsers(user.id),
    getOwnedListsWithShares(user.id),
    getVisibleContactOwnerIds(user.id),
  ]);
  const contactSharedWithIds = visibleContactOwnerIds.filter((id) => id !== user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {user.mustChangePassword && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          You&apos;re signed in with a temporary password — set your own below.
        </p>
      )}
      {/* Open by default while a password change is required, so the forced
          flow doesn't hide its own fields behind a collapsed section. */}
      <CollapsibleSection title="Appearance" defaultOpen>
        <ThemePicker theme={parseTheme(user.theme)} themeMode={parseThemeMode(user.themeMode)} />
      </CollapsibleSection>
      <CollapsibleSection title="Change password" defaultOpen={user.mustChangePassword}>
        <ChangePasswordForm />
      </CollapsibleSection>
      <CollapsibleSection title="Share your lists">
        <div className="space-y-3">
          <p className="text-sm text-foreground/60">
            Only you can change who your own lists are shared with. Anyone a list is shared with can fully edit it, same as you.
          </p>
          <ListSharingSection lists={ownedLists} otherUsers={otherUsers} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Share your contacts">
        <div className="space-y-3">
          <p className="text-sm text-foreground/60">
            Contact sharing is all-or-nothing and mutual — turning it on shares your whole address book with them, and theirs with you.
          </p>
          <ContactSharingSection otherUsers={otherUsers} sharedWithIds={contactSharedWithIds} />
        </div>
      </CollapsibleSection>
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-md border border-foreground/15 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground active:bg-foreground/20"
        >
          <TreePine className="size-4" strokeWidth={1.75} />
          Admin
        </Link>
      )}
    </div>
  );
}
