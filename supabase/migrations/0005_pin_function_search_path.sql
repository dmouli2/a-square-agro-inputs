-- Supabase's security linter flags set_updated_at() for a mutable search_path: without an
-- explicit SET, a user who can create objects in an earlier schema on the search_path could
-- shadow unqualified references and change what the trigger actually executes. Pinning it to
-- an empty search_path closes that off; now() still resolves fine since pg_catalog is always
-- implicitly searched regardless of this setting.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = '';
