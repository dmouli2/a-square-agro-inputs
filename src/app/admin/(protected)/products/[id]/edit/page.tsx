import { notFound } from "next/navigation";
import Image from "next/image";
import { getDb } from "@/lib/db";
import { getImageStorage } from "@/lib/storage";
import { ProductForm } from "@/components/admin/ProductForm";
import { addVariant, editVariant, removeVariant } from "@/app/actions/products";
import { removeProductImage, uploadProductImage } from "@/app/actions/productImages";

const inputClass =
  "h-10 rounded-control border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 w-full";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [product, categories] = await Promise.all([db.products.findById(id), db.categories.list()]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">{product.name}</h1>
        <p className="text-sm text-muted mt-1">{product.brand}</p>
      </div>

      <ProductForm categories={categories} mode="edit" product={product} />

      <div className="rounded-card border border-border bg-surface p-4 flex flex-col gap-4">
        <h2 className="font-display font-semibold text-sm text-foreground">Photos</h2>

        {product.images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {product.images.map((path) => (
              <div key={path} className="relative aspect-square rounded-control overflow-hidden border border-border">
                <Image
                  src={getImageStorage().getPublicUrl(path)}
                  alt=""
                  fill
                  sizes="150px"
                  className="object-cover"
                />
                <form action={removeProductImage.bind(null, product.id, path)} className="absolute top-1 right-1">
                  <button
                    type="submit"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form action={uploadProductImage.bind(null, product.id)} className="flex items-center gap-3">
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="text-sm text-muted file:mr-3 file:rounded-control file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
          />
          <button
            type="submit"
            className="shrink-0 h-9 rounded-control bg-primary-700 text-white text-xs font-medium px-3.5 hover:bg-primary-800"
          >
            Upload
          </button>
        </form>
      </div>

      <div className="rounded-card border border-border bg-surface p-4 flex flex-col gap-4">
        <h2 className="font-display font-semibold text-sm text-foreground">Pack sizes</h2>

        {product.variants.map((variant) => (
          <div key={variant.id} className="flex flex-col gap-2 rounded-control border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {variant.label} · {variant.sku}
              </span>
              <form action={removeVariant.bind(null, variant.id, product.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </form>
            </div>
            <form action={editVariant.bind(null, variant.id, product.id)} className="grid grid-cols-3 gap-2">
              <input name="price" type="number" step="any" defaultValue={variant.price} required className={inputClass} placeholder="Price" />
              <input name="mrp" type="number" step="any" defaultValue={variant.mrp} required className={inputClass} placeholder="MRP" />
              <input
                name="stockQty"
                type="number"
                defaultValue={variant.stockQty}
                required
                className={inputClass}
                placeholder="Stock"
              />
              <button
                type="submit"
                className="col-span-3 h-9 rounded-control bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100"
              >
                Update
              </button>
            </form>
          </div>
        ))}

        <form action={addVariant.bind(null, product.id)} className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <input name="label" placeholder="Label (e.g. 1 kg)" required className={`${inputClass} col-span-2`} />
          <input name="sku" placeholder="SKU" required className={inputClass} />
          <select name="unit" defaultValue="piece" className={inputClass}>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="L">L</option>
            <option value="packet">packet</option>
            <option value="piece">piece</option>
          </select>
          <input name="packSize" type="number" step="any" placeholder="Pack size" defaultValue={1} className={inputClass} />
          <input name="price" type="number" step="any" placeholder="Price" required className={inputClass} />
          <input name="mrp" type="number" step="any" placeholder="MRP" required className={inputClass} />
          <input name="stockQty" type="number" placeholder="Stock" defaultValue={0} className={inputClass} />
          <button
            type="submit"
            className="col-span-2 h-9 rounded-control bg-primary-700 text-white text-xs font-medium hover:bg-primary-800"
          >
            + Add pack size
          </button>
        </form>
      </div>
    </div>
  );
}
