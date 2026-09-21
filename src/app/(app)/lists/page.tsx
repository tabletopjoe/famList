import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLists, getPrimaryList } from "@/modules/lists/queries";
import { CreateListForm } from "@/modules/lists/components/CreateListForm";
import { ListCardList } from "@/modules/lists/components/ListCardList";
import { ListsFilterSortBar } from "@/modules/lists/components/ListsFilterSortBar";
import { parseOwnershipFilter, type OwnershipFilter } from "@/components/OwnershipFilterChips";
import { parseListSort, parseListSortDir, parseListKindFilter, type ListKind } from "@/modules/lists/types";

/** Presentation-only pluralization for the empty-state message — not worth a shared label map for one sentence. */
const KIND_FILTER_NOUN: Record<ListKind, string> = {
  shopping: "shopping lists",
  collection: "collections",
  notes: "notes",
  recipe: "recipe lists",
};

function emptyMessage(filter: OwnershipFilter, kindFilter: ListKind | null): string {
  const noun = kindFilter ? KIND_FILTER_NOUN[kindFilter] : "lists";
  if (filter === "mine") return `You haven't created any ${noun} yet.`;
  if (filter === "shared") return `No ${noun} have been shared with you yet.`;
  return kindFilter ? `No ${noun} yet.` : "No lists yet — create one above.";
}

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string; type?: string; sort?: string; dir?: string; panel?: string }>;
}) {
  const user = await getCurrentUser();
  const { view, filter: rawFilter, type: rawType, sort: rawSort, dir: rawDir, panel: rawPanel } = await searchParams;
  const filter = parseOwnershipFilter(rawFilter);
  const kindFilter = parseListKindFilter(rawType);
  const sort = parseListSort(rawSort);
  const dir = parseListSortDir(rawDir, sort);
  const panel = rawPanel === "filter" ? "filter" : "sort";

  // Default entry point: jump straight to the primary list, if one is set.
  // The top bar's "Lists" title links here with ?view=all to bypass this
  // and always land on the overview instead.
  if (view !== "all") {
    const primary = await getPrimaryList(user.id);
    if (primary) {
      redirect(`/lists/${primary.id}`);
    }
  }

  const lists = await getLists(user.id, filter, sort, dir, kindFilter);
  const anyPrimary = user.primaryListId !== null;

  return (
    <div className="-mt-4 space-y-6">
      <CreateListForm />
      <ListsFilterSortBar panel={panel} filter={filter} typeFilter={kindFilter} sort={sort} dir={dir} />
      {lists.length === 0 ? (
        <p className="text-sm text-foreground/60">{emptyMessage(filter, kindFilter)}</p>
      ) : (
        <ListCardList lists={lists} primaryListId={user.primaryListId} anyPrimary={anyPrimary} draggable={sort === "custom"} />
      )}
    </div>
  );
}
