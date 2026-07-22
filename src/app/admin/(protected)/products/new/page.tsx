import { getDb } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await getDb().categories.list();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="font-display font-bold text-2xl text-foreground">New product</h1>
      <ProductForm categories={categories} mode="create" />
    </div>
  );
}
