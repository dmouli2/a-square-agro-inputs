import { getSupabaseClient } from "@/lib/supabase/client";
import type { StaffRepository } from "@/lib/db/types";
import { mapStaff } from "./mappers";

export function createSupabaseStaffRepository(): StaffRepository {
  return {
    async findByEmail(email) {
      const { data, error } = await getSupabaseClient()
        .from("staff")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      return data ? mapStaff(data) : null;
    },
    async findById(id) {
      const { data, error } = await getSupabaseClient().from("staff").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? mapStaff(data) : null;
    },
  };
}
