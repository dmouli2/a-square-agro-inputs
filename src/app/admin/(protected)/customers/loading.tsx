import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

export default function CustomersLoading() {
  return <AdminTableSkeleton title="Customers" columns={5} />;
}
