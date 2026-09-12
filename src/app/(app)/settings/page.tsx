import { getCurrentUser } from "@/lib/auth/dal";
import { getOwnedListsWithShares } from "@/modules/lists/queries";
import { getVisibleContactOwnerIds } from "@/modules/contacts/queries";
import { getOtherUsers } from "@/modules/settings/queries";
import { ChangePasswordForm } from "@/modules/settings/components/ChangePasswordForm";
import { ListSharingSection } from "@/modules/settings/components/ListSharingSection";
import { ContactSharingSection } from "@/modules/settings/components/ContactSharingSection";

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
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Change password</h2>
        <ChangePasswordForm />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Share your lists</h2>
        <p className="text-sm text-white/60">
          Only you can change who your own lists are shared with. Anyone a list is shared with can fully edit it, same as you.
        </p>
        <ListSharingSection lists={ownedLists} otherUsers={otherUsers} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Share your contacts</h2>
        <p className="text-sm text-white/60">
          Contact sharing is all-or-nothing and mutual — turning it on shares your whole address book with them, and theirs with you.
        </p>
        <ContactSharingSection otherUsers={otherUsers} sharedWithIds={contactSharedWithIds} />
      </section>
    </div>
  );
}
