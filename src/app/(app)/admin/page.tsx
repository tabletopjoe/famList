import { requireAdmin } from "@/lib/auth/dal";
import { getAllUsers } from "@/modules/admin/queries";
import { CreateUserForm } from "@/modules/admin/components/CreateUserForm";
import { UserManager } from "@/modules/admin/components/UserManager";

export default async function AdminPage() {
  const currentUser = await requireAdmin();
  const users = await getAllUsers();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Create a family member</h2>
        <CreateUserForm />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Manage users</h2>
        <UserManager users={users} currentUserId={currentUser.id} />
      </section>
    </div>
  );
}
