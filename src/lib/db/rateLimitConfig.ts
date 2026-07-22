// Shared thresholds so the mock and Supabase rate-limiter adapters enforce
// the same policy. IP limit is looser than the phone limit since rural
// mobile networks commonly NAT many customers behind one carrier-grade IP.
export const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
export const RATE_LIMIT_MAX_PER_PHONE = 5;
export const RATE_LIMIT_MAX_PER_IP = 8;
