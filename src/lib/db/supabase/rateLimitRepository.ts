import { getSupabaseClient } from "@/lib/supabase/client";
import type { RateLimiterRepository } from "@/lib/db/types";
import { RATE_LIMIT_MAX_PER_IP, RATE_LIMIT_MAX_PER_PHONE, RATE_LIMIT_WINDOW_SECONDS } from "@/lib/db/rateLimitConfig";

export function createSupabaseRateLimiterRepository(): RateLimiterRepository {
  return {
    async checkAndRecord({ ip, phone }) {
      const client = getSupabaseClient();
      // Fail open: a rate-limiter outage must never be able to take down
      // checkout for every shopper — worst case a flood gets through until
      // the underlying issue is fixed.
      try {
        const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
        const [{ count: ipCount, error: ipError }, { count: phoneCount, error: phoneError }] = await Promise.all([
          client.from("checkout_attempts").select("*", { count: "exact", head: true }).eq("ip", ip).gte("created_at", cutoff),
          client
            .from("checkout_attempts")
            .select("*", { count: "exact", head: true })
            .eq("phone", phone)
            .gte("created_at", cutoff),
        ]);
        if (ipError) throw ipError;
        if (phoneError) throw phoneError;

        const allowed = (ipCount ?? 0) < RATE_LIMIT_MAX_PER_IP && (phoneCount ?? 0) < RATE_LIMIT_MAX_PER_PHONE;

        const { error: insertError } = await client.from("checkout_attempts").insert({ ip, phone });
        if (insertError) throw insertError;

        return allowed ? { allowed: true } : { allowed: false, retryAfterSeconds: RATE_LIMIT_WINDOW_SECONDS };
      } catch (err) {
        console.error("rate limiter check failed, failing open", err);
        return { allowed: true };
      }
    },
  };
}
