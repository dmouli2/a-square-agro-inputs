-- Seeds the first admin account. There is no signup flow — generate a bcrypt
-- hash first, then run this in the Supabase SQL Editor:
--
--   node scripts/hash-password.mjs "<your-password>"
--
-- Paste the resulting hash below in place of the placeholder, and set a real
-- email, before running this file.

insert into staff (name, email, password_hash, role, active)
values ('Admin', 'admin@asquareagro.com', '<paste-bcrypt-hash-here>', 'admin', true);
