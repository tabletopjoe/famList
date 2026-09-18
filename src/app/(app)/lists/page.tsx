import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLists, getPrimaryList } from "@/modules/lists/queries";
import { CreateListForm } from "@/modules/lists/components/CreateListForm";
import { ListCardList } from "@/modules/lists/components/ListCardList";
import { ListsFilterSortBar } from "@/modules/lists/components/ListsFilterSortBar";
import { parseOwnershipFilter } from "@/components/OwnershipFilterChips";
import { parseListSort, parseListSortDir } from "@/modules/lists/types";

const EMPTY_MESSAGE = {
  all: "No lists yet — create one above.",
  mine: "You haven't created any lists yet.",
  shared: "No lists have been shared with you yet.",
};

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string; sort?: string; dir?: string; panel?: string }>;
}) {
  const user = await getCurrentUser();
  const { view, filter: rawFilter, sort: rawSort, dir: rawDir, panel: rawPanel } = await searchParams;
  const filter = parseOwnershipFilter(rawFilter);
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

  const lists = await getLists(user.id, filter, sort, dir);
  const anyPrimary = user.primaryListId !== null;

  return (
    <div className="space-y-6">
      <CreateListForm />
      <ListsFilterSortBar panel={panel} filter={filter} sort={sort} dir={dir} />
      {lists.length === 0 ? (
        <p className="text-sm text-white/60">{EMPTY_MESSAGE[filter]}</p>
      ) : (
        <ListCardList lists={lists} primaryListId={user.primaryListId} anyPrimary={anyPrimary} draggable={sort === "custom"} />
      )}
    </div>
  );
}
