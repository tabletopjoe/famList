import { requireAdmin } from "@/lib/auth/dal";
import { getAllUsers } from "@/modules/admin/queries";
import { CreateUserForm } from "@/modules/admin/components/CreateUserForm";
import { UserRow } from "@/modules/admin/components/UserRow";

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
        <h2 className="text-lg font-medium">Users</h2>
        <div className="space-y-3">
          {users.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === currentUser.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
