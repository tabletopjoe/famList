/**
 * Central module registry. Each entry describes one feature module that
 * lives under `src/modules/<key>` and is routed at `src/app/(app)/<key>`.
 *
 * To add a new module (e.g. "Calendar"):
 *   1. Create `src/modules/calendar/` with its own actions/queries/components.
 *   2. Create `src/app/(app)/calendar/page.tsx` that uses them.
 *   3. Add a `data model` (Prisma models) if it needs persistence.
 *   4. Add one entry below — the nav picks it up automatically.
 */
export type ModuleDefinition = {
  key: string;
  name: string;
  href: string;
  description: string;
  icon: string; // emoji keeps this dependency-free; swap for real icons later if wanted
};

export const modules: ModuleDefinition[] = [
  {
    key: "lists",
    name: "Lists",
    href: "/lists",
    description: "Groceries, packing lists, to-dos — anything the family tracks together.",
    icon: "📋",
  },
  {
    key: "contacts",
    name: "Contacts",
    href: "/contacts",
    description: "The family address book.",
    icon: "📇",
  },
];
