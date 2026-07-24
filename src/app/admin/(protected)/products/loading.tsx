import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

export default function ProductsLoading() {
  return <AdminTableSkeleton title="Products" columns={5} withSearch />;
}
