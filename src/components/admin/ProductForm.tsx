"use client";

import { useActionState, useState } from "react";
import type { Category, Product } from "@/types";
import { createProduct, updateProduct, type ProductFormState } from "@/app/actions/products";
import { Button } from "@/components/ui/Button";

const initialState: ProductFormState = { error: null };

const inputClass =
  "h-11 rounded-control border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 w-full";
const textareaClass =
  "rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 w-full";
const labelClass = "text-sm font-medium text-foreground mb-1.5 block";

interface ProductFormProps {
  categories: Category[];
  mode: "create" | "edit";
  product?: Product;
}

export function ProductForm({ categories, mode, product }: ProductFormProps) {
  const action = mode === "create" ? createProduct : updateProduct.bind(null, product!.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  // Every field below is uncontrolled (defaultValue only). React 19 resets
  // uncontrolled fields to their defaultValue once a form action settles —
  // fine on create (the page redirects away), but edit mode revalidates and
  // re-renders in place, so without forcing a remount here a successful save
  // would visually snap every field back to its pre-edit value even though
  // the database write succeeded (defaultValue was still whatever it was at
  // the form's original mount). Bumping the key on a successful save forces
  // a fresh mount with defaultValue re-read from the newly revalidated
  // `product` prop, matching what was just saved.
  const [lastState, setLastState] = useState(state);
  const [formVersion, setFormVersion] = useState(0);
  if (state !== lastState) {
    setLastState(state);
    if (state.error === null) setFormVersion((v) => v + 1);
  }

  return (
    <form key={formVersion} action={formAction} className="flex flex-col gap-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="name">Product name</label>
          <input id="name" name="name" defaultValue={product?.name} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="brand">Brand / manufacturer</label>
          <input id="brand" name="brand" defaultValue={product?.brand} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="categoryId">Category</label>
          <select id="categoryId" name="categoryId" defaultValue={product?.categoryId} required className={inputClass}>
            <option value="" disabled>
              Select category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={product?.status ?? "draft"} className={inputClass}>
            <option value="draft">Draft (hidden from shop)</option>
            <option value="active">Active (visible in shop)</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2.5 rounded-control border border-border p-3.5 w-fit cursor-pointer">
        <input
          type="checkbox"
          name="isBestseller"
          defaultChecked={product?.isBestseller}
          className="h-4 w-4 accent-primary-700"
        />
        <span className="text-sm">
          <span className="font-medium text-foreground">Show &ldquo;Bestseller&rdquo; ribbon</span>
          <span className="block text-xs text-muted">Your call to make — this isn&apos;t derived from sales data.</span>
        </span>
      </label>

      <div>
        <label className={labelClass} htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={product?.description} className={textareaClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="cropCompatibility">Crop compatibility (comma-separated)</label>
        <input
          id="cropCompatibility"
          name="cropCompatibility"
          defaultValue={product?.cropCompatibility.join(", ")}
          placeholder="Cotton, Chilli, Paddy"
          className={inputClass}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="activeIngredient">Active ingredient</label>
          <input id="activeIngredient" name="activeIngredient" defaultValue={product?.activeIngredient} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="composition">Composition</label>
          <input id="composition" name="composition" defaultValue={product?.composition} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="registrationNumber">CIB&amp;RC registration number</label>
          <input id="registrationNumber" name="registrationNumber" defaultValue={product?.registrationNumber} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="hsnCode">HSN code</label>
          <input id="hsnCode" name="hsnCode" defaultValue={product?.hsnCode} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="usageInstructions">Usage instructions</label>
        <textarea id="usageInstructions" name="usageInstructions" rows={2} defaultValue={product?.usageInstructions} className={textareaClass} />
      </div>

      {mode === "create" && (
        <div className="rounded-card border border-border p-4 flex flex-col gap-4">
          <h3 className="font-display font-semibold text-sm text-foreground">First pack size</h3>
          <p className="text-xs text-muted -mt-2">
            Add more pack sizes after creating the product.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="variantLabel">Label (e.g. &quot;500 g&quot;)</label>
              <input id="variantLabel" name="variantLabel" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="variantPackSize">Pack size</label>
              <input id="variantPackSize" name="variantPackSize" type="number" step="any" defaultValue={1} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="variantUnit">Unit</label>
              <select id="variantUnit" name="variantUnit" defaultValue="piece" className={inputClass}>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="packet">packet</option>
                <option value="piece">piece</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="variantSku">SKU</label>
              <input id="variantSku" name="variantSku" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="variantPrice">Price (₹)</label>
              <input id="variantPrice" name="variantPrice" type="number" step="any" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="variantMrp">MRP (₹)</label>
              <input id="variantMrp" name="variantMrp" type="number" step="any" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="variantStockQty">Stock quantity</label>
              <input id="variantStockQty" name="variantStockQty" type="number" defaultValue={0} required className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-control px-3.5 py-2.5">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
      </Button>
    </form>
  );
}
