-- Defense-in-depth data-integrity constraints. The app layer already
-- validates these invariants (src/lib/cart.ts's isValidQuantity/getCartMap,
-- and the stock-sufficiency check added to both order repository adapters),
-- but nothing enforced them at the database level — a future bug, a direct
-- SQL edit, or a new codepath that bypasses the Server Action layer could
-- still write a negative price/quantity/stock row. These CHECK constraints
-- make that impossible regardless of which code path writes the row.
--
-- APPLIED to the production database (verified 2026-07-22: all three tables
-- reject violating rows with these named constraints). Note it was applied
-- via the SQL editor, so Supabase's migration-history table has no record of
-- it — a future `supabase db push` would try to rerun this file.

alter table product_variants
  add constraint product_variants_price_nonnegative check (price >= 0),
  add constraint product_variants_mrp_nonnegative check (mrp >= 0),
  add constraint product_variants_stock_qty_nonnegative check (stock_qty >= 0),
  add constraint product_variants_pack_size_positive check (pack_size > 0);

alter table order_items
  add constraint order_items_quantity_positive check (quantity > 0),
  add constraint order_items_price_at_purchase_nonnegative check (price_at_purchase >= 0);

alter table orders
  add constraint orders_subtotal_nonnegative check (subtotal >= 0),
  add constraint orders_discount_nonnegative check (discount >= 0),
  add constraint orders_total_nonnegative check (total >= 0);

-- products.updated_at was never actually updated by the app (toProductRow()
-- in src/lib/db/supabase/productRepository.ts doesn't set it, so every edit
-- silently left the column equal to created_at) — a trigger is the
-- reliable fix since it can't be forgotten by a future patch() call.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- orders.status is filtered/sorted on by every admin order list/queue view;
-- there's no index today. Low urgency at current order volumes, but cheap
-- to add now before it becomes a real query-planner problem.
create index if not exists orders_status_idx on orders(status);
