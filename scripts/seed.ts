// Seeds the sample catalog (src/lib/mock-data.ts) into the connected Supabase
// project. Run after applying supabase/migrations/0001_init.sql.
// Usage: npx tsx --env-file=.env.local scripts/seed.ts
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES, PRODUCTS } from "../src/lib/mock-data";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set (check .env.local).");
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { error: categoryError } = await client.from("categories").upsert(
    CATEGORIES.map((c, i) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      sort_order: i,
    })),
    { onConflict: "slug" }
  );
  if (categoryError) throw categoryError;
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  const { data: categoryRows, error: fetchCategoryError } = await client
    .from("categories")
    .select("id, slug");
  if (fetchCategoryError) throw fetchCategoryError;
  const categoryIdBySlug = new Map<string, string>(
    (categoryRows ?? []).map((row) => [row.slug as string, row.id as string])
  );
  const mockIdToSlug = new Map(CATEGORIES.map((c) => [c.id, c.slug]));

  for (const product of PRODUCTS) {
    const categorySlug = mockIdToSlug.get(product.categoryId);
    const categoryId = categorySlug ? categoryIdBySlug.get(categorySlug) : undefined;
    if (!categoryId) {
      console.warn(`Skipping ${product.slug}: category not found.`);
      continue;
    }

    const { data: productRow, error: productError } = await client
      .from("products")
      .upsert(
        {
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          category_id: categoryId,
          description: product.description,
          images: product.images,
          status: product.status,
          crop_compatibility: product.cropCompatibility,
          active_ingredient: product.activeIngredient,
          composition: product.composition,
          usage_instructions: product.usageInstructions,
          registration_number: product.registrationNumber,
          hsn_code: product.hsnCode,
        },
        { onConflict: "slug" }
      )
      .select()
      .single();
    if (productError) throw productError;

    const { error: variantError } = await client.from("product_variants").upsert(
      product.variants.map((v) => ({
        product_id: productRow.id,
        sku: v.sku,
        label: v.label,
        pack_size: v.packSize,
        unit: v.unit,
        price: v.price,
        mrp: v.mrp,
        stock_qty: v.stockQty,
        batch_number: v.batchNumber,
        mfg_date: v.mfgDate,
        expiry_date: v.expiryDate,
      })),
      { onConflict: "sku" }
    );
    if (variantError) throw variantError;
    console.log(`Seeded ${product.name} (${product.variants.length} variants).`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
