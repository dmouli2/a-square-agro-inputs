import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

export default function OrdersLoading() {
  return <AdminTableSkeleton title="Orders" columns={5} withSearch />;
}
