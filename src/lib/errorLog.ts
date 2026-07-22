import { getDb } from "@/lib/db";

interface ErrorDetails {
  message: string;
  stack?: string;
  path?: string;
  context?: Record<string, unknown>;
}

/**
 * Best-effort server-side error capture — no external service (see README
 * "Engineering hygiene"). Never throws itself: a logging failure must not
 * mask or replace the original error the caller is already handling. Split
 * out from logError so the reportClientError Server Action (which already
 * has a decomposed message/stack from the browser's Error object) can write
 * a log entry without re-deriving them through `new Error(...)`.
 */
export async function logErrorDetails(details: ErrorDetails): Promise<void> {
  try {
    await getDb().errorLogs.create(details);
  } catch (err) {
    console.error("logError failed", err);
  }
}

export async function logError(error: unknown, path?: string, context?: Record<string, unknown>): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  await logErrorDetails({ message, stack, path, context });
}
