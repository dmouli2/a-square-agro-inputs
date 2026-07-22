import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function AdminEditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getDb().categories.findById(id);
  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl text-foreground">Edit category</h1>
      <CategoryForm mode="edit" category={category} />
    </div>
  );
}
