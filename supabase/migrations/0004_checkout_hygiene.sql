-- Engineering hygiene: checkout flood/bot protection + lightweight in-house
-- error monitoring (no external service — see README "Engineering hygiene").

-- Backs RateLimiterRepository (src/lib/db/supabase/rateLimitRepository.ts):
-- every placeOrder attempt is recorded here, keyed by ip and phone, and the
-- action counts recent rows in a sliding window before allowing a new order.
create table checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create index checkout_attempts_ip_created_at_idx on checkout_attempts(ip, created_at);
create index checkout_attempts_phone_created_at_idx on checkout_attempts(phone, created_at);

-- Service-role-only, same as every other backend-only table in this project
-- (orders, customers, addresses, ...) — no policies means no anon/authenticated
-- access via PostgREST; only the service-role key used by getDb() can reach it.
alter table checkout_attempts enable row level security;

-- Backs ErrorLogRepository (src/lib/db/supabase/errorLogRepository.ts):
-- best-effort server-side error capture from Server Action catch blocks and
-- the root/storefront error boundaries, viewable at /admin/errors.
create table error_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  stack text,
  context jsonb,
  path text,
  created_at timestamptz not null default now()
);

create index error_logs_created_at_idx on error_logs(created_at desc);

alter table error_logs enable row level security;
