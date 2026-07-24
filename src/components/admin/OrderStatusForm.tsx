"use client";

import { useActionState, useState } from "react";
import { updateOrderStatus, type UpdateOrderStatusState } from "@/app/actions/adminOrders";
import { Button } from "@/components/ui/Button";
import type { OrderStatus } from "@/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export function OrderStatusForm({ orderId, initialStatus }: { orderId: string; initialStatus: OrderStatus }) {
  const initialState: UpdateOrderStatusState = { error: null, status: initialStatus };
  const [state, formAction, isPending] = useActionState(updateOrderStatus.bind(null, orderId), initialState);
  // Tracks the last-seen action result (by identity, not just status value) so
  // `selected` mirrors the committed status once an action settles, success or
  // rejection alike — the button's "only enable once you actually change the
  // value" check depends on this staying in sync.
  const [lastState, setLastState] = useState(state);
  const [selected, setSelected] = useState(state.status);
  if (state !== lastState) {
    setLastState(state);
    setSelected(state.status);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <form action={formAction} className="flex items-center gap-2">
        {/*
          Uncontrolled on purpose (defaultValue, not value), keyed to remount
          whenever the confirmed status changes. React 19 resets uncontrolled
          form fields to their defaultValue after a form action settles; a
          *controlled* select fights that native reset and silently ends up
          showing the browser's fallback (the first option) instead of the
          value React thinks it has. Remounting on the confirmed status keeps
          defaultValue — and therefore the native reset's target — correct.
        */}
        <select
          key={state.status}
          name="status"
          defaultValue={state.status}
          onChange={(e) => setSelected(e.target.value as OrderStatus)}
          disabled={isPending}
          className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60 capitalize"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <Button type="submit" size="md" disabled={isPending || selected === state.status}>
          {isPending ? "Updating…" : "Update"}
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
