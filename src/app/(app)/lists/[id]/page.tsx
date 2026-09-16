import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getListWithItems } from "@/modules/lists/queries";
import { AddItemForm } from "@/modules/lists/components/AddItemForm";
import { ItemRow } from "@/modules/lists/components/ItemRow";
import { ListControls } from "@/modules/lists/components/ListControls";
import { DeleteModeProvider } from "@/modules/lists/components/DeleteModeContext";
import type { ListKind } from "@/modules/lists/types";

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const list = await getListWithItems(id, user.id);

  if (!list) {
    notFound();
  }

  return (
    <div className="-mt-4 space-y-3">
      <div className="flex items-center gap-3">
        <Link
          href="/lists?view=all"
          style={{ height: "calc((var(--chrome-size) - 12px) * 0.6)" }}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
          All lists
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold">{list.title}</h1>
      </div>
      <DeleteModeProvider>
        <ListControls
          listId={list.id}
          kind={list.kind as ListKind}
          resetIntervalDays={list.resetIntervalDays}
          doneCount={list.items.filter((item) => item.isDone).length}
          totalCount={list.items.length}
        />
        <AddItemForm listId={list.id} />
        {list.items.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No items yet — add one above.</p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/15">
            {list.items.map((item, index) => {
              const prev = list.items[index - 1];
              const next = list.items[index + 1];
              return (
                <ItemRow
                  key={item.id}
                  listId={list.id}
                  item={item}
                  canMoveUp={!!prev && prev.isDone === item.isDone}
                  canMoveDown={!!next && next.isDone === item.isDone}
                />
              );
            })}
          </ul>
        )}
      </DeleteModeProvider>
    </div>
  );
}
