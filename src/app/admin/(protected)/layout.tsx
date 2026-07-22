import { requireRole } from "@/lib/dal";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/AdminNav";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireRole(["admin"]);

  return (
    <div className="min-h-screen flex">
      <AdminSidebar staffName={staff.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileNav />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
