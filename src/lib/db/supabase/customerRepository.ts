import { getSupabaseClient } from "@/lib/supabase/client";
import type { CustomerRepository } from "@/lib/db/types";
import type { CustomerSummary } from "@/types";

interface CustomerOrderRow {
  total: unknown;
  status: string;
  created_at: string;
}

export function createSupabaseCustomerRepository(): CustomerRepository {
  return {
    async list() {
      const { data, error } = await getSupabaseClient()
        .from("customers")
        .select("*, orders(total, status, created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((row): CustomerSummary => {
        const orders = (row.orders as CustomerOrderRow[]) ?? [];
        const counted = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
        const lastOrderAt = orders.reduce<string | null>(
          (latest, o) => (latest === null || o.created_at > latest ? o.created_at : latest),
          null
        );
        return {
          id: row.id as string,
          fullName: row.full_name as string,
          phone: row.phone as string,
          email: (row.email as string) ?? undefined,
          orderCount: orders.length,
          totalSpent: counted.reduce((sum, o) => sum + Number(o.total), 0),
          lastOrderAt,
        };
      });
    },
  };
}
