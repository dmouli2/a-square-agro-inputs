-- Admin-set flag for the storefront "Bestseller" ribbon. Not derived from
-- sales/order data — the admin panel's product form controls it directly.
alter table products add column if not exists is_bestseller boolean not null default false;
