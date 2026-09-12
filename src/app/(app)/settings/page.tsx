import { getCurrentUser } from "@/lib/auth/dal";
import { ChangePasswordForm } from "@/modules/settings/components/ChangePasswordForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
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
    </div>
  );
}
