import { getSupabaseClient, isInvalidUuidError } from "@/lib/supabase/client";
import type { ProductRepository } from "@/lib/db/types";
import type { Product, ProductVariant, ProductWithVariants } from "@/types";
import { mapProduct, mapVariant } from "./mappers";

const PRODUCT_WITH_VARIANTS_SELECT = "*, product_variants(*)";

// PostgREST's .or() takes a raw filter-string ("cond1,cond2,...") that it
// parses itself — "," separates conditions and "()" nest groups, so an
// unescaped search term could inject extra filter clauses rather than just
// matching text (filter-string injection). "%"/"_" are SQL LIKE wildcards
// too, so strip those as well rather than letting a search turn into an
// open wildcard scan. Only characters that can plausibly appear in a
// product/brand name survive.
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9\s-]/g, "").trim().slice(0, 100);
}

function toProductWithVariants(row: Record<string, unknown>): ProductWithVariants {
  const variantRows = (row.product_variants as Record<string, unknown>[]) ?? [];
  return { ...mapProduct(row), variants: variantRows.map(mapVariant) };
}

function toProductRow(patch: Partial<Product>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.brand !== undefined) row.brand = patch.brand;
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.images !== undefined) row.images = patch.images;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.cropCompatibility !== undefined) row.crop_compatibility = patch.cropCompatibility;
  if (patch.activeIngredient !== undefined) row.active_ingredient = patch.activeIngredient;
  if (patch.composition !== undefined) row.composition = patch.composition;
  if (patch.usageInstructions !== undefined) row.usage_instructions = patch.usageInstructions;
  if (patch.registrationNumber !== undefined) row.registration_number = patch.registrationNumber;
  if (patch.hsnCode !== undefined) row.hsn_code = patch.hsnCode;
  if (patch.isBestseller !== undefined) row.is_bestseller = patch.isBestseller;
  return row;
}

function toVariantRow(patch: Partial<Omit<ProductVariant, "id" | "productId">>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.sku !== undefined) row.sku = patch.sku;
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.packSize !== undefined) row.pack_size = patch.packSize;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.mrp !== undefined) row.mrp = patch.mrp;
  if (patch.stockQty !== undefined) row.stock_qty = patch.stockQty;
  if (patch.batchNumber !== undefined) row.batch_number = patch.batchNumber;
  if (patch.mfgDate !== undefined) row.mfg_date = patch.mfgDate;
  if (patch.expiryDate !== undefined) row.expiry_date = patch.expiryDate;
  return row;
}

export function createSupabaseProductRepository(): ProductRepository {
  return {
    async list(params) {
      const client = getSupabaseClient();
      let query = client.from("products").select(PRODUCT_WITH_VARIANTS_SELECT).eq("status", "active");

      if (params?.categorySlug) {
        const { data: category } = await client
          .from("categories")
          .select("id")
          .eq("slug", params.categorySlug)
          .maybeSingle();
        if (!category) return [];
        query = query.eq("category_id", category.id as string);
      }

      if (params?.search) {
        const term = sanitizeSearchTerm(params.search);
        if (term) {
          query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(toProductWithVariants);
    },

    async listAll() {
      const { data, error } = await getSupabaseClient()
        .from("products")
        .select(PRODUCT_WITH_VARIANTS_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toProductWithVariants);
    },

    async findBySlug(slug) {
      const { data, error } = await getSupabaseClient()
        .from("products")
        .select(PRODUCT_WITH_VARIANTS_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? toProductWithVariants(data) : null;
    },

    async findById(id) {
      const { data, error } = await getSupabaseClient()
        .from("products")
        .select(PRODUCT_WITH_VARIANTS_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) {
        if (isInvalidUuidError(error)) return null;
        throw error;
      }
      return data ? toProductWithVariants(data) : null;
    },

    async findByVariantId(variantId) {
      const client = getSupabaseClient();
      const { data: variantRow, error: variantError } = await client
        .from("product_variants")
        .select("product_id")
        .eq("id", variantId)
        .maybeSingle();
      if (variantError) {
        if (isInvalidUuidError(variantError)) return null;
        throw variantError;
      }
      if (!variantRow) return null;

      const { data, error } = await client
        .from("products")
        .select(PRODUCT_WITH_VARIANTS_SELECT)
        .eq("id", variantRow.product_id)
        .maybeSingle();
      if (error) throw error;
      return data ? toProductWithVariants(data) : null;
    },

    async create(product, variants) {
      const client = getSupabaseClient();
      const { data: productRow, error: productError } = await client
        .from("products")
        .insert(toProductRow(product))
        .select()
        .single();
      if (productError) throw productError;

      if (variants.length > 0) {
        const { error: variantError } = await client
          .from("product_variants")
          .insert(variants.map((v) => ({ ...toVariantRow(v), product_id: productRow.id })));
        if (variantError) throw variantError;
      }

      const created = await this.findBySlug(productRow.slug as string);
      if (!created) throw new Error("Failed to load product after create");
      return created;
    },

    async update(id, patch) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("products")
        .update(toProductRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const updated = await this.findBySlug(data.slug as string);
      if (!updated) throw new Error("Failed to load product after update");
      return updated;
    },

    async createVariant(productId, variant) {
      const { data, error } = await getSupabaseClient()
        .from("product_variants")
        .insert({ ...toVariantRow(variant), product_id: productId })
        .select()
        .single();
      if (error) throw error;
      return mapVariant(data);
    },

    async updateVariant(variantId, patch) {
      const { data, error } = await getSupabaseClient()
        .from("product_variants")
        .update(toVariantRow(patch))
        .eq("id", variantId)
        .select()
        .single();
      if (error) throw error;
      return mapVariant(data);
    },

    async deleteVariant(variantId) {
      const { error } = await getSupabaseClient().from("product_variants").delete().eq("id", variantId);
      if (error) throw error;
    },
  };
}
