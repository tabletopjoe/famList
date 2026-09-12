import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLists, getPrimaryList } from "@/modules/lists/queries";
import { CreateListForm } from "@/modules/lists/components/CreateListForm";
import { ListCard } from "@/modules/lists/components/ListCard";
import { OwnershipFilterChips, parseOwnershipFilter } from "@/components/OwnershipFilterChips";

const EMPTY_MESSAGE = {
  all: "No lists yet — create one above.",
  mine: "You haven't created any lists yet.",
  shared: "No lists have been shared with you yet.",
};

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; filter?: string }>;
}) {
  const user = await getCurrentUser();
  const { view, filter: rawFilter } = await searchParams;
  const filter = parseOwnershipFilter(rawFilter);

  // Default entry point: jump straight to the primary list, if one is set.
  // The top bar's "Lists" title links here with ?view=all to bypass this
  // and always land on the overview instead.
  if (view !== "all") {
    const primary = await getPrimaryList(user.id);
    if (primary) {
      redirect(`/lists/${primary.id}`);
    }
  }

  const lists = await getLists(user.id, filter);
  const anyPrimary = user.primaryListId !== null;

  return (
    <div className="space-y-6">
      <CreateListForm />
      <OwnershipFilterChips
        current={filter}
        hrefFor={(f) => `/lists?view=all${f === "all" ? "" : `&filter=${f}`}`}
      />
      {lists.length === 0 ? (
        <p className="text-sm text-white/60">{EMPTY_MESSAGE[filter]}</p>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              isPrimary={list.id === user.primaryListId}
              anyPrimary={anyPrimary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
