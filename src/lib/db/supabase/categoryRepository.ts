import { getSupabaseClient } from "@/lib/supabase/client";
import type { CategoryRepository } from "@/lib/db/types";
import type { Category } from "@/types";
import { mapCategory } from "./mappers";

function toCategoryRow(patch: Partial<Omit<Category, "id">>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description ?? null;
  if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl ?? null;
  if (patch.parentId !== undefined) row.parent_id = patch.parentId;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  return row;
}

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
    async findById(id) {
      const { data, error } = await getSupabaseClient()
        .from("categories")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapCategory(data) : null;
    },
    async create(input) {
      const { data, error } = await getSupabaseClient()
        .from("categories")
        .insert(toCategoryRow(input))
        .select("*")
        .single();
      if (error) throw error;
      return mapCategory(data);
    },
    async update(id, patch) {
      const { data, error } = await getSupabaseClient()
        .from("categories")
        .update(toCategoryRow(patch))
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return mapCategory(data);
    },
    async delete(id) {
      const { error } = await getSupabaseClient().from("categories").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
