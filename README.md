# A Square Agro Inputs

Ecommerce storefront + admin panel for A Square Agro Inputs — seeds, fertilizers,
crop protection and farm tools for farmers, sold direct with doorstep delivery. Checkout is
**guest + Cash on Delivery only** — no accounts, no payment gateway.

Live at https://a-square-agro-inputs.vercel.app, running on the real Supabase database.

## Commands

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
npm run seed     # insert src/lib/mock-data.ts into the connected Supabase project
```

There is no signup flow. The first admin account was created directly via
`node scripts/create-admin.mjs <email> [password]` (upserts a bcrypt-hashed row into `staff`
using the service-role key — no DB password or SQL editor needed; omit the password to get a
random one printed once). `supabase/seed.sql` is an alternative if you'd rather paste-and-run in
the SQL editor instead. In mock mode (no Supabase env vars — e.g. running `npm run dev` without
`.env.local`), a fixed dev account exists instead: `admin@asquareagro.com` / `admin123`.

## Architecture

Ports-and-adapters, same discipline as the team's other Next.js/Supabase projects:

- `src/types/index.ts` — domain types (Product, ProductVariant, Order, Staff, Coupon, …).
- `src/lib/db/types.ts` — repository port interfaces (`ProductRepository`, `OrderRepository`,
  `StaffRepository`, …).
- `src/lib/db/index.ts` — `getDb()` singleton. Auto-switches between two adapters based on
  whether `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are set (`hasSupabaseConfig()`):
  - `src/lib/db/mock/` — in-memory, backed by `src/lib/mock-data.ts` plus a fixed dev staff
    account. State lives on `globalThis` (not a plain module-level `let`) because Next.js
    compiles Route Handlers/Server Actions/RSC page renders as separate module layers that
    don't otherwise share state — this bit us once (orders vanishing between checkout and the
    confirmation page) before the fix.
  - `src/lib/db/supabase/` — real Postgres via `@supabase/supabase-js`, service-role key only,
    imported nowhere else. **Categories, products (incl. variant CRUD), orders and staff are
    fully live**; only coupons still fall back to the mock repo (unused so far — no coupon UI
    exists yet). This is also the mode the deployed app runs in.
- `src/lib/storage/` — same ports-and-adapters shape for product photos: `types.ts` (`upload`/
  `remove`/`getPublicUrl`), `supabase/imageStorage.ts` (the only other place
  `@supabase/supabase-js` may be imported, alongside `src/lib/db/supabase/` and the shared
  client factory `src/lib/supabase/client.ts`). Backed by a **public** `product-images` Storage
  bucket (created via `scripts/create-image-bucket.mjs`, not a migration — bucket creation is a
  Storage API call, not DDL) — public because these are public catalog photos, not the private
  per-order photos the team's other project deals with, so plain public URLs are stored on
  `products.images` directly rather than resolving signed URLs on every read.
- `supabase/migrations/0001_init.sql` — categories, vendors (single house vendor seeded, ready
  for multi-vendor expansion), products, product_variants, customers (deduped by unique
  `phone`, no Supabase Auth — checkout is guest-only), addresses, orders/order_items, coupons,
  and `staff` (bcrypt + JWT session, not Supabase Auth). RLS: public read on active
  products/categories; everything else is service-role-only — there's no logged-in customer
  session to scope policies to, so all of it goes through Server Actions.
- Auth has two layers, same split as the team's other project: `src/proxy.ts` only decrypts the
  session cookie for a fast, optimistic redirect on `/admin/*` — it never hits the database.
  `src/lib/dal.ts` (`requireRole(["admin"])`) does the real check on every admin page/Server
  Action: re-fetches the staff record from `getDb()` and redirects if missing/inactive.
- **Next.js 16 renamed `middleware.ts` → `proxy.ts` upstream** (not project-specific — verified
  against `node_modules/next/dist/docs/`). Don't reintroduce a `middleware.ts` file.
- Server Actions default to a 1MB body limit; `next.config.ts` raises `serverActions.bodySizeLimit`
  to 4mb for image uploads, staying under Vercel's own ~4.5MB serverless request ceiling.

Route groups keep the storefront, its checkout, and the admin panel cleanly separated:

```
src/app/(storefront)/            →  /, /shop, /product/[slug], /cart, /orders, /orders/[id]
src/app/admin/login/             →  /admin/login (outside the auth-gated group, no redirect loop)
src/app/admin/(protected)/       →  /admin (dashboard), /admin/products, /admin/orders — all
                                     gated by requireRole() in this group's layout.tsx
```

## Design system

"Fresh modern agritech": brand green (`--primary-*` in `src/app/globals.css`) matched to the
logo, a warm amber accent (`--accent-*`) for CTAs/sale badges, Plus Jakarta Sans for headings
+ Inter for body copy, generous rounded cards (`rounded-card` = 1.25rem) with soft elevation
(`shadow-card` / `shadow-card-hover`). Mobile-first: a bottom tab bar
(`src/components/layout/MobileTabBar.tsx`) drives storefront navigation under `md`. A floating
WhatsApp button (`src/components/storefront/WhatsAppButton.tsx`) deep-links to `wa.me` on every
storefront page. The admin panel is intentionally plainer/table-driven (functional, not
decorative) but reuses the same color/font tokens.

## What's built so far

- **Storefront**: home (real-photo hero banner, prominent search, "why farmers choose us"
  section), shop listing (category filters + text search via `?q=`), product detail (photo
  gallery with thumbnails, variant picker, crop compatibility, compliance info for regulated
  agrochemicals), cart with a live quantity stepper, guest checkout (name/phone/address, COD
  only, inline validation via `useActionState`), order confirmation page. The product page shows
  "N in your cart → Go to cart" once an item's added, instead of letting you double-add the same
  variant. Product cards (`ProductCard` + `QuickAddButton`) have a hover-lift/zoom effect and a
  quick add-to-cart control (adds the lowest-priced variant, becomes a +/- stepper once in cart)
  without leaving the grid. Search (`SearchBar`) is a plain GET form to `/shop?q=`, so it works
  with JS disabled; `ProductRepository.list({ search })` was already wired end-to-end in both
  adapters, only the UI was missing. Branded `loading.tsx`/`not-found.tsx`/`error.tsx` cover the
  storefront route group instead of falling back to Next's defaults.
- **Admin panel**: email/password login (bcrypt + JWT cookie), dashboard (product/order counts,
  low-stock, revenue, recent orders), product list/create/edit with full pack-size (variant)
  CRUD and photo upload/removal, order list/detail with status updates.
- Real catalog + order + staff + photo data — the deployed app runs on this, not mock data.
- PWA manifest (`public/manifest.json`) + SVG icon. The icon is a placeholder monogram — no
  source logo file exists yet, swap `public/icon.svg` in whenever the real one is available.

## What's next (not built yet)

**Checkout & orders**
- Out of scope (decided 2026-07-22, don't re-propose): coupons (schema + port exist but stay
  unwired), shipping/delivery-fee & pincode-serviceability logic, and GST/tax line items
  (HSN codes stay stored per product, unsurfaced).
- ~~`/orders` tab placeholder~~ **Done (2026-07-22):** phone-number lookup page — remembers the
  checkout phone in an httpOnly `a2_phone` cookie (1 year) and also accepts `?phone=`; both
  inputs are validated by `isValidPhone` in `src/lib/orderLookup.ts` before hitting
  `orders.listByPhone()`. Known trade-off, accepted: anyone who knows a customer's phone number
  can view that customer's order history/address (no OTP step).
- ~~No order notifications~~ **Done (2026-07-22), wa.me-link flavor by explicit decision** (no
  WhatsApp Business API / Twilio — zero cost, one manual tap per message, `src/lib/whatsapp.ts`):
  the order confirmation page's "Send order on WhatsApp" button prefills the full order summary
  into a chat with the store number, and the admin order detail's "Notify customer" button
  prefills a status-specific update into a chat with the customer. Automated server-side sending
  is a possible future upgrade — the message formatters in `src/lib/whatsapp.ts` are already
  separated from link building with that in mind.

**Admin panel**
- Out of scope (decided 2026-07-22, don't re-propose): staff management UI — one admin account
  via `scripts/create-admin.mjs` is sufficient; banners/homepage content management; bulk CSV
  import/export for products.
- ~~Categories are fixed/seeded~~ **Done (2026-07-22): dynamic category CRUD.** `/admin/categories`
  (list, `new`, `[id]/edit`) backed by `CategoryRepository.create/update/delete` in
  `src/lib/db/types.ts` — no migration needed, the live `categories` table already had `slug`
  (unique), `sort_order`, `parent_id`, `description`, `image_url`. Slug is regenerated from the
  name on every save (`slugify`); a duplicate name surfaces as a friendly "already exists" error
  instead of the raw Postgres unique-violation. Delete is blocked (action + UI both) while any
  product still references the category — `src/app/actions/categories.ts`'s `deleteCategory`
  checks `products.listAll()` first for a friendly message, backed by the real FK constraint.
- ~~No customer list view~~ **Done (2026-07-22).** `/admin/customers` — new `CustomerRepository`
  port (`src/lib/db/types.ts`) joins `customers` to `orders` and aggregates order count, total
  spend (cancelled/returned excluded, matching the dashboard revenue rule) and last-order date
  per customer, mock and Supabase adapters both implemented.
- ~~No analytics beyond the basic dashboard counts~~ **Done (2026-07-22).** Pure, unit-tested
  aggregation functions in `src/lib/analytics.ts` (`revenueTrend`, `topSellers`,
  `statusBreakdown`) feed three new dashboard sections: a 14-day daily revenue bar chart (zero-
  filled so the x-axis has no gaps, `title` attribute + a `sr-only` table for accessibility),
  a top-5-sellers-by-units ranking, and an order-status breakdown reusing the existing status
  color tokens. Colors reuse the app's brand `--primary-*` ramp and existing per-status colors
  rather than introducing a new palette.
- ~~No search/pagination on the products/orders tables~~ **Done (2026-07-22).** Both admin tables
  get a `?q=` search box (products: name/brand; orders: order id/customer name/phone, all
  case-insensitive) and `?page=` pagination at 20 rows/page — shared `src/lib/pagination.ts`
  (`parsePage`/`paginate`) and `src/components/admin/Pagination.tsx` (Previous/Next, preserves
  the active search query in its links).
- No hard-delete for products (status changes to draft/archived only).

**Storefront**
- No per-product SEO (`generateMetadata`) — only site-wide metadata exists.
- No sitemap.xml / robots.txt.
- No related products, reviews, or wishlist.
- No regional-language support (worth considering given the farmer audience).

**Branding & PWA**
- `public/images/hero-sunrise-paddy.jpg` and `public/images/trust-farmers-field.jpg` are
  real, CC0-licensed photos sourced from Wikimedia Commons (no attribution required, but see
  each file's Commons page if that ever changes) — placeholders until real branded photography
  exists. No AI-generated imagery was used; there's no image-generation tool in this environment.
- Real logo asset (still the placeholder "A²" monogram) — swap `public/icon.svg` in when available.
- No proper PNG/apple-touch-icon sizes (SVG-only manifest icon; iOS "Add to Home Screen" won't
  look right without one).
- No service worker / install banner — manifest exists but the app isn't actually
  installable/offline-capable yet.

**Engineering hygiene**
- Now committed and pushed to `github.com/dmouli2/a-square-agro-inputs` (`main` branch, no CI
  wired to it yet — see below). Commit author auto-detected as
  `dineshmouli@Dineshs-MacBook-Air.local` rather than a real GitHub email; fix with
  `git config --global user.email` and amend if that matters to you.
- No automated tests.
- CI/CD is **out of scope** (decided 2026-07-22) — deploys are deliberately manual `vercel --prod --yes`; don't re-propose pipelines.
- No error monitoring (Sentry or similar).
- No rate-limiting/bot protection on the checkout form (open to spam orders — no CAPTCHA/throttle).
- Still on the `*.vercel.app` URL, no custom domain.

## How this was verified

No browser tool is available in this environment, so nothing here was confirmed by literally
clicking through it — `npm run build`/`npm run lint` catch type/lint errors, and the
request/response-level flows (login with right/wrong credentials, `requireRole` blocking an
unauthenticated request, product + variant CRUD, order status updates, the checkout → order
persistence path, image upload/public-URL-fetch/delete) were exercised directly — first against
mock data, then again against the real Supabase project once it was wired up — via temporary
Route Handlers that called the real Server Actions, then were deleted. Actually clicking through
the deployed app is still worth doing.

## Setting up Supabase (done — kept for reference)

`.env.local` is filled in and verified working end to end. If setting this up again elsewhere:
apply `supabase/migrations/0001_init.sql` via the Supabase dashboard's SQL Editor (no DB
password needed for that step), then:

```bash
npm run seed                                        # catalog
npx tsx --env-file=.env.local scripts/create-image-bucket.mjs   # storage bucket
npx tsx --env-file=.env.local scripts/create-admin.mjs <email>  # admin account
```
