import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Service-role client — only ever used server-side (Server Components/Actions
 * calling through getDb()), never sent to the browser. RLS is bypassed by
 * design here; the ports layer is the access boundary for UI code.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export function resetSupabaseClientForTests() {
  client = null;
}

/**
 * True for Postgres's "invalid input syntax for type uuid" (22P02) — thrown
 * when a `.eq("id", value)` lookup gets a malformed id (e.g. a stale mock-data
 * id like "var-3a" left over in a browser's cart cookie from before the app
 * was wired to Supabase). Callers treat this the same as "row not found"
 * rather than letting it crash the page.
 */
export function isInvalidUuidError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "22P02";
}
