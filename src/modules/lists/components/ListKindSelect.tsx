"use client";

import { useState, type ComponentProps } from "react";
import { LIST_KINDS, LIST_KIND_LABELS, listKindOptionLabel } from "../types";

/**
 * The list-type <select> (CreateListForm, ListSettingsMenu). Each type's
 * "(checklist)"-style hint is only for choosing — it shows in the options
 * while the picker is being interacted with, and the closed select goes
 * back to the bare label once a choice is made or focus leaves. A native
 * select always displays its selected option's own text, so this swaps the
 * option text itself rather than styling anything.
 */
export function ListKindSelect(props: Omit<ComponentProps<"select">, "children">) {
  const [choosing, setChoosing] = useState(false);

  return (
    <select
      {...props}
      // Pointer-down fires before the native picker opens (desktop), focus
      // covers the mobile pickers and keyboard; both are needed because a
      // select that's still focused after a pick gets no new focus event
      // when it's opened a second time.
      onPointerDown={(e) => {
        setChoosing(true);
        props.onPointerDown?.(e);
      }}
      onFocus={(e) => {
        setChoosing(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setChoosing(false);
        props.onBlur?.(e);
      }}
      onChange={(e) => {
        setChoosing(false);
        props.onChange?.(e);
      }}
    >
      {LIST_KINDS.map((k) => (
        <option key={k} value={k} className="bg-white/80 text-field-ink">
          {choosing ? listKindOptionLabel(k) : LIST_KIND_LABELS[k]}
        </option>
      ))}
    </select>
  );
}
