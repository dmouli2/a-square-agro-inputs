import { getSupabaseClient } from "@/lib/supabase/client";
import type { LoginRateLimiterRepository } from "@/lib/db/types";
import { LOGIN_RATE_LIMIT_MAX_PER_EMAIL, LOGIN_RATE_LIMIT_MAX_PER_IP, LOGIN_RATE_LIMIT_WINDOW_SECONDS } from "@/lib/db/rateLimitConfig";

export function createSupabaseLoginRateLimiterRepository(): LoginRateLimiterRepository {
  return {
    async checkAndRecord({ ip, email }) {
      const client = getSupabaseClient();
      // Fail open: a rate-limiter outage must never lock every admin out of the
      // panel — worst case a brute-force attempt gets through until it's fixed.
      try {
        const cutoff = new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
        const [{ count: ipCount, error: ipError }, { count: emailCount, error: emailError }] = await Promise.all([
          client.from("login_attempts").select("*", { count: "exact", head: true }).eq("ip", ip).gte("created_at", cutoff),
          client
            .from("login_attempts")
            .select("*", { count: "exact", head: true })
            .eq("email", email)
            .gte("created_at", cutoff),
        ]);
        if (ipError) throw ipError;
        if (emailError) throw emailError;

        const allowed = (ipCount ?? 0) < LOGIN_RATE_LIMIT_MAX_PER_IP && (emailCount ?? 0) < LOGIN_RATE_LIMIT_MAX_PER_EMAIL;

        const { error: insertError } = await client.from("login_attempts").insert({ ip, email });
        if (insertError) throw insertError;

        return allowed ? { allowed: true } : { allowed: false, retryAfterSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS };
      } catch (err) {
        console.error("login rate limiter check failed, failing open", err);
        return { allowed: true };
      }
    },
  };
}
