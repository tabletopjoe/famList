import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getListWithItems } from "@/modules/lists/queries";
import { AddItemForm } from "@/modules/lists/components/AddItemForm";
import { ItemRow } from "@/modules/lists/components/ItemRow";

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser();
  const { id } = await params;
  const list = await getListWithItems(id);

  if (!list) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/lists" className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← All lists
        </Link>
        <h1 className="text-2xl font-semibold">{list.title}</h1>
      </div>
      <AddItemForm listId={list.id} />
      {list.items.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">No items yet — add one above.</p>
      ) : (
        <ul className="divide-y divide-black/10 dark:divide-white/15">
          {list.items.map((item) => (
            <ItemRow key={item.id} listId={list.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
