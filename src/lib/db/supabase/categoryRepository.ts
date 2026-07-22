import { getSupabaseClient } from "@/lib/supabase/client";
import type { CategoryRepository } from "@/lib/db/types";
import { mapCategory } from "./mappers";

export function createSupabaseCategoryRepository(): CategoryRepository {
  return {
    async list() {
      const { data, error } = await getSupabaseClient()
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapCategory);
    },
    async findBySlug(slug) {
      const { data, error } = await getSupabaseClient()
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? mapCategory(data) : null;
    },
  };
}
