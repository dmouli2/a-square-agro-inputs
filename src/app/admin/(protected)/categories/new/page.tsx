import { CategoryForm } from "@/components/admin/CategoryForm";

export default function AdminNewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-bold text-2xl text-foreground">New category</h1>
      <CategoryForm mode="create" />
    </div>
  );
}
