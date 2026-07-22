"use client";

import { useActionState } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import { Button } from "@/components/ui/Button";

const initialState: CheckoutState = { error: null };

const inputClass =
  "h-11 rounded-control border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500";

export function CheckoutForm() {
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h2 className="font-display font-bold text-lg text-foreground">Delivery details</h2>

      <div className="grid grid-cols-2 gap-3">
        <input name="fullName" placeholder="Full name" required className={`${inputClass} col-span-2`} />
        <input name="phone" type="tel" placeholder="Phone number" required className={`${inputClass} col-span-2`} />
        <input name="email" type="email" placeholder="Email (optional)" className={`${inputClass} col-span-2`} />
        <input name="line1" placeholder="House / street" required className={`${inputClass} col-span-2`} />
        <input name="line2" placeholder="Landmark (optional)" className={`${inputClass} col-span-2`} />
        <input name="village" placeholder="Village / town" className={`${inputClass} col-span-2`} />
        <input name="district" placeholder="District" required className={inputClass} />
        <input name="state" placeholder="State" required className={inputClass} />
        <input name="pincode" placeholder="Pincode" required className={inputClass} />
      </div>

      <div className="rounded-card bg-primary-50/60 border border-primary-100 p-3.5 text-sm text-primary-800 flex items-center gap-2">
        <span>💰</span>
        <span>Cash on Delivery — pay when your order arrives.</span>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-control px-3.5 py-2.5">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Placing order…" : "Place order (Cash on Delivery)"}
      </Button>
    </form>
  );
}
