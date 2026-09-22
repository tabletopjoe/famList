import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLists, getPrimaryList } from "@/modules/lists/queries";
import { CreateListForm } from "@/modules/lists/components/CreateListForm";
import { ListCardList } from "@/modules/lists/components/ListCardList";
import { ListsFilterSortBar } from "@/modules/lists/components/ListsFilterSortBar";
import { parseOwnershipFilter, type OwnershipFilter } from "@/components/OwnershipFilterChips";
import { parseListSort, parseListSortDir, parseListKindFilter, type ListKind } from "@/modules/lists/types";

// Written by ListsFilterSortBar (a plain Server Component can't set cookies
// during render) whenever the resolved filter/type/sort/dir/panel change.
// Read here only to fill in params a bare entry point (nav icon, the top
// bar's title, "All lists") left out entirely — an explicit link always
// spells out all five, even ones matching their own default, specifically
// so it's never confused with "no preference given, use what I had last".
const VIEW_COOKIE = "famlist_lists_view";

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

  const cookieStore = await cookies();
  const remembered = new URLSearchParams(cookieStore.get(VIEW_COOKIE)?.value ?? "");
  const orRemembered = (raw: string | undefined, key: string) => raw ?? remembered.get(key) ?? undefined;

  const filter = parseOwnershipFilter(orRemembered(rawFilter, "filter"));
  const kindFilter = parseListKindFilter(orRemembered(rawType, "type"));
  const sort = parseListSort(orRemembered(rawSort, "sort"));
  const dir = parseListSortDir(orRemembered(rawDir, "dir"), sort);
  const panel = orRemembered(rawPanel, "panel") === "filter" ? "filter" : "sort";

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
