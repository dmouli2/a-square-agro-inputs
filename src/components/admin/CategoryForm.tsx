"use client";

import { useActionState } from "react";
import type { Category } from "@/types";
import { createCategory, updateCategory, type CategoryFormState } from "@/app/actions/categories";
import { Button } from "@/components/ui/Button";

const initialState: CategoryFormState = { error: null };

const inputClass =
  "h-11 rounded-control border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 w-full";
const textareaClass =
  "rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 w-full";
const labelClass = "text-sm font-medium text-foreground mb-1.5 block";

interface CategoryFormProps {
  mode: "create" | "edit";
  category?: Category;
}

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const action = mode === "create" ? createCategory : updateCategory.bind(null, category!.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-xl">
      <div>
        <label className={labelClass} htmlFor="name">Category name</label>
        <input id="name" name="name" defaultValue={category?.name} className={inputClass} required />
        <p className="text-xs text-muted mt-1.5">
          The storefront URL slug is generated from the name automatically.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          defaultValue={category?.description}
          rows={3}
          className={textareaClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="sortOrder">Sort order</label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          step={1}
          defaultValue={category?.sortOrder ?? 0}
          className={`${inputClass} max-w-32`}
        />
        <p className="text-xs text-muted mt-1.5">Lower numbers appear first on the storefront.</p>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
      </Button>
    </form>
  );
}
