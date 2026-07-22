"use server";

import { logErrorDetails } from "@/lib/errorLog";

/**
 * Lets client-side error boundaries (which can't import getDb() — that would
 * bundle the Supabase service-role client into the browser) report a caught
 * error for the /admin/errors log.
 */
export async function reportClientError(message: string, stack: string | undefined, path: string): Promise<void> {
  await logErrorDetails({ message, stack, path });
}
