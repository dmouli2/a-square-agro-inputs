-- A Square Agro Inputs — initial schema
-- Ports-and-adapters note: this is only ever read/written through
-- src/lib/db/supabase/*. All public storefront reads go through RLS;
-- all writes go through Server Actions using the service role key.

create extension if not exists "pgcrypto";

create type product_status as enum ('draft', 'active', 'archived');
create type order_status as enum ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned');
create type variant_unit as enum ('g', 'kg', 'ml', 'L', 'packet', 'piece');
create type coupon_type as enum ('flat', 'percent');
create type staff_role as enum ('admin');

-- ---------------------------------------------------------------------------
-- Staff (admin panel auth — mirrors the JWT/bcrypt session pattern, not
-- Supabase Auth; only admins manage the catalog for now).
-- ---------------------------------------------------------------------------
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role staff_role not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table staff enable row level security;
-- No public policies: staff lookups happen server-side via the service role key only.

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  sort_order int not null default 0
);
alter table categories enable row level security;
create policy "categories are publicly readable" on categories
  for select using (true);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table vendors enable row level security;
create policy "vendors are publicly readable" on vendors
  for select using (true);
-- Seed the single house vendor so vendor_id is populated from day one,
-- ready for multi-vendor expansion without a data migration.
insert into vendors (id, name) values ('00000000-0000-0000-0000-000000000001', 'A Square Agro Inputs');

create table products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) default '00000000-0000-0000-0000-000000000001',
  category_id uuid not null references categories(id),
  slug text not null unique,
  name text not null,
  brand text not null,
  description text not null default '',
  images text[] not null default '{}',
  status product_status not null default 'draft',
  crop_compatibility text[] not null default '{}',
  active_ingredient text,
  composition text,
  usage_instructions text,
  registration_number text,
  hsn_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on products(category_id);
create index products_vendor_id_idx on products(vendor_id);
alter table products enable row level security;
create policy "active products are publicly readable" on products
  for select using (status = 'active');

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text not null unique,
  label text not null,
  pack_size numeric not null,
  unit variant_unit not null,
  price numeric(10, 2) not null,
  mrp numeric(10, 2) not null,
  stock_qty int not null default 0,
  batch_number text,
  mfg_date date,
  expiry_date date
);
create index product_variants_product_id_idx on product_variants(product_id);
alter table product_variants enable row level security;
create policy "variants of publicly readable products are publicly readable" on product_variants
  for select using (
    exists (select 1 from products p where p.id = product_variants.product_id and p.status = 'active')
  );

-- ---------------------------------------------------------------------------
-- Customers, addresses — guest checkout, no Supabase Auth. Customers are
-- deduped by phone (server-side upsert in the checkout Server Action) so the
-- admin panel gets a real customer list and repeat orders group together.
-- Every table here is service-role-only: there's no logged-in session to
-- scope RLS to.
-- ---------------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  email text,
  created_at timestamptz not null default now()
);
alter table customers enable row level security;

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  village text,
  district text not null,
  state text not null,
  pincode text not null
);
create index addresses_customer_id_idx on addresses(customer_id);
alter table addresses enable row level security;

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type coupon_type not null,
  value numeric(10, 2) not null,
  min_order_value numeric(10, 2) not null default 0,
  expires_at timestamptz,
  active boolean not null default true
);
alter table coupons enable row level security;
-- No public policies: coupon codes are validated server-side via the service role key.

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  status order_status not null default 'pending',
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  shipping_address_id uuid not null references addresses(id),
  coupon_code text,
  created_at timestamptz not null default now()
);
create index orders_customer_id_idx on orders(customer_id);
alter table orders enable row level security;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  product_name text not null,
  variant_label text not null,
  quantity int not null,
  price_at_purchase numeric(10, 2) not null
);
create index order_items_order_id_idx on order_items(order_id);
alter table order_items enable row level security;
