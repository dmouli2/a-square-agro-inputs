import { getSupabaseClient } from "@/lib/supabase/client";
import type { ErrorLogRepository } from "@/lib/db/types";
import type { ErrorLogEntry } from "@/types";

export function createSupabaseErrorLogRepository(): ErrorLogRepository {
  return {
    async create(entry) {
      // Logging must never itself throw — a broken error-log write shouldn't
      // mask or replace the original error being reported.
      try {
        const { error } = await getSupabaseClient()
          .from("error_logs")
          .insert({ message: entry.message, stack: entry.stack, context: entry.context, path: entry.path });
        if (error) throw error;
      } catch (err) {
        console.error("failed to write error log", err);
      }
    },

    async list(limit = 100) {
      const { data, error } = await getSupabaseClient()
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      return (data ?? []).map(
        (row): ErrorLogEntry => ({
          id: row.id as string,
          message: row.message as string,
          stack: (row.stack as string) ?? undefined,
          context: (row.context as Record<string, unknown>) ?? undefined,
          path: (row.path as string) ?? undefined,
          createdAt: row.created_at as string,
        })
      );
    },
  };
}
