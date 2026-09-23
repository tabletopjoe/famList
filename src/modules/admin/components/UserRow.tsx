"use client";

import { useActionState, useTransition } from "react";
import { resetUserPassword, setUserRole, deleteUser, type AdminActionState } from "../actions";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
};

export function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [resetState, resetAction, resetPending] = useActionState<AdminActionState, FormData>(
    resetUserPassword,
    undefined
  );
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-foreground/15 bg-card-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {user.name} {isSelf && <span className="text-foreground/40">(you)</span>}
          </p>
          <p className="text-sm text-foreground/60">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={user.role}
            disabled={isSelf || isPending}
            onChange={(e) => startTransition(() => setUserRole(user.id, e.target.value))}
            title={isSelf ? "You can't change your own role" : "Change role"}
            className="rounded-md border border-foreground/15 bg-foreground/5 px-2 py-1 text-sm disabled:opacity-50"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <form action={resetAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              disabled={resetPending}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:bg-foreground/80 disabled:opacity-50"
            >
              Reset password
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `Delete ${user.name}'s account? This permanently removes their lists, contacts, and access. This can't be undone.`,
                )
              ) {
                startTransition(() => deleteUser(user.id));
              }
            }}
            disabled={isSelf || isPending}
            title={isSelf ? "You can't delete your own account" : "Delete account"}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 active:text-red-200 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      {user.mustChangePassword && (
        <p className="mt-2 text-xs text-amber-300">Still on a temporary password — hasn&apos;t set their own yet.</p>
      )}
      {resetState && "error" in resetState && <p className="mt-2 text-sm text-red-500">{resetState.error}</p>}
      {resetState && "tempPassword" in resetState && (
        <p className="mt-2 text-sm text-green-500">
          New temp password: <span className="font-mono">{resetState.tempPassword}</span> — share this once.
        </p>
      )}
    </div>
  );
}
