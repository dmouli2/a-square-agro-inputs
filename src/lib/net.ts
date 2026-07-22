import { headers } from "next/headers";

/**
 * Best-effort caller IP for the checkout rate limiter. Vercel populates
 * x-forwarded-for on every request; falls back to x-real-ip, then a fixed
 * placeholder so a rate-limit check never throws over a missing header.
 */
export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwardedFor = store.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = store.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
