import { getCurrentUser } from "@/lib/auth/dal";
import { getLists } from "@/modules/lists/queries";
import { CreateListForm } from "@/modules/lists/components/CreateListForm";
import { ListCard } from "@/modules/lists/components/ListCard";

export default async function ListsPage() {
  await getCurrentUser();
  const lists = await getLists();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Lists</h1>
      <CreateListForm />
      {lists.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">No lists yet — create one above.</p>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
