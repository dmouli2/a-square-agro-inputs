-- Supabase's performance linter flagged three foreign keys with no covering
-- index — each makes the corresponding join/cascade do a sequential scan.
create index categories_parent_id_idx on categories(parent_id);
create index order_items_variant_id_idx on order_items(variant_id);
create index orders_shipping_address_id_idx on orders(shipping_address_id);
