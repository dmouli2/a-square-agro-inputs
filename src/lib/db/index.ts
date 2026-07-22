import type { Database } from "@/lib/db/types";
import { createMockDb } from "@/lib/db/mock";
import { createSupabaseDb } from "@/lib/db/supabase";
import { hasSupabaseConfig } from "@/lib/supabase/client";

let dbInstance: Database | null = null;

export function getDb(): Database {
  if (!dbInstance) {
    dbInstance = hasSupabaseConfig() ? createSupabaseDb() : createMockDb();
  }
  return dbInstance;
}

export function resetDbForTests() {
  dbInstance = null;
}
