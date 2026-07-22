"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

const initialState: LoginState = { error: null };

const inputClass =
  "h-11 rounded-control border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input name="email" type="email" placeholder="Email" required autoComplete="username" className={inputClass} />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        autoComplete="current-password"
        className={inputClass}
      />

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-control px-3.5 py-2.5">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
