-- Admin login had no brute-force protection: unlimited password guesses against
-- /admin/login, unlike checkout's existing checkout_attempts guard. Backs
-- LoginRateLimiterRepository (src/lib/db/supabase/loginRateLimitRepository.ts):
-- every login() attempt is recorded here, keyed by ip and email, and the action
-- counts recent rows in a sliding window before allowing bcrypt to even run.
create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index login_attempts_ip_created_at_idx on login_attempts(ip, created_at);
create index login_attempts_email_created_at_idx on login_attempts(email, created_at);

-- Service-role-only, same as checkout_attempts and every other backend-only
-- table in this project — no policies means no anon/authenticated access via
-- PostgREST; only the service-role key used by getDb() can reach it.
alter table login_attempts enable row level security;
