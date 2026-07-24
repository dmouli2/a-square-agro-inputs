// Shared thresholds so the mock and Supabase rate-limiter adapters enforce
// the same policy. IP limit is looser than the phone limit since rural
// mobile networks commonly NAT many customers behind one carrier-grade IP.
export const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
export const RATE_LIMIT_MAX_PER_PHONE = 5;
export const RATE_LIMIT_MAX_PER_IP = 8;

// Admin login brute-force protection — tighter than checkout since it guards staff
// credentials rather than a shopper placing an order. IP limit stays looser than the
// per-email limit for the same shared-office-network reason as checkout.
export const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
export const LOGIN_RATE_LIMIT_MAX_PER_EMAIL = 5;
export const LOGIN_RATE_LIMIT_MAX_PER_IP = 10;
