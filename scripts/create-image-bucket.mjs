// One-off: creates the public product-images Storage bucket.
// Usage: npx tsx --env-file=.env.local scripts/create-image-bucket.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set (check .env.local).");
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });

const { error } = await client.storage.createBucket("product-images", {
  public: true,
  fileSizeLimit: "4MB",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
});

if (error && !error.message.includes("already exists")) {
  console.error(error);
  process.exit(1);
}

console.log(error ? "Bucket already exists." : "Created product-images bucket.");
