import { cookies } from "next/headers";

export const PHONE_COOKIE = "a2_phone";

/** One year — long enough that a returning seasonal buyer still finds their orders. */
export const PHONE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Same rule checkout enforces: Indian 10-digit mobile numbers. The cookie
 * value and the ?phone= query param are both attacker-controlled, so every
 * lookup path funnels through this guard before reaching the database.
 */
export function isValidPhone(value: unknown): value is string {
  return typeof value === "string" && /^[6-9]\d{9}$/.test(value);
}

export async function getRememberedPhone(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(PHONE_COOKIE)?.value;
  return isValidPhone(raw) ? raw : null;
}
