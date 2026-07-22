// Creates (or resets) an admin staff account directly via the service role key.
// Usage: npx tsx --env-file=.env.local scripts/create-admin.mjs <email> [password]
// If password is omitted, a random one is generated and printed once.
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/create-admin.mjs <email> [password]");
  process.exit(1);
}
const password = process.argv[3] ?? randomBytes(9).toString("base64url");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set (check .env.local).");
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });
const passwordHash = await bcrypt.hash(password, 10);

const { error } = await client
  .from("staff")
  .upsert(
    { name: "Admin", email: email.toLowerCase(), password_hash: passwordHash, role: "admin", active: true },
    { onConflict: "email" }
  );

if (error) {
  console.error(error);
  process.exit(1);
}

console.log("Admin account ready:");
console.log(`  Email:    ${email.toLowerCase()}`);
console.log(`  Password: ${password}`);
