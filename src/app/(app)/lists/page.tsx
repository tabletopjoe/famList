import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLists, getPrimaryList } from "@/modules/lists/queries";
import { CreateListForm } from "@/modules/lists/components/CreateListForm";
import { ListCard } from "@/modules/lists/components/ListCard";

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await getCurrentUser();
  const { view } = await searchParams;

  // Default entry point: jump straight to the primary list, if one is set.
  // The top bar's "Lists" title links here with ?view=all to bypass this
  // and always land on the overview instead.
  if (view !== "all") {
    const primary = await getPrimaryList();
    if (primary) {
      redirect(`/lists/${primary.id}`);
    }
  }

  const lists = await getLists();
  const anyPrimary = lists.some((list) => list.isPrimary);

  return (
    <div className="space-y-6">
      <CreateListForm />
      {lists.length === 0 ? (
        <p className="text-sm text-white/60">No lists yet — create one above.</p>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} anyPrimary={anyPrimary} />
          ))}
        </div>
      )}
    </div>
  );
}
