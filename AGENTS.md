# A Square Agro Inputs

Ecommerce storefront + admin panel, selling agro inputs (seeds, fertilizers, crop protection,
farm tools) to farmers. See `README.md` for commands, architecture, and current build status
before making changes.

This is a **stock, unmodified** Next.js 16 install (no patched fork) — but Next.js 16.0.0 itself
renamed `middleware.ts` → `proxy.ts` upstream (`export function proxy(...)`, same file
conventions otherwise). Don't assume training-data knowledge is current for anything
version-sensitive; check `node_modules/next/dist/docs/` before relying on an API you haven't
verified against this exact version.

## Conventions

- Ports-and-adapters, two parallel instances of the pattern:
  - DB: domain types (`src/types/`) → `src/lib/db/types.ts` → `src/lib/db/mock/` /
    `src/lib/db/supabase/`, selected by `getDb()` in `src/lib/db/index.ts`.
  - Images: `src/lib/storage/types.ts` → `src/lib/storage/supabase/imageStorage.ts`, selected
    by `getImageStorage()` in `src/lib/storage/index.ts`.
  - `@supabase/supabase-js` may only be imported inside `src/lib/db/supabase/`,
    `src/lib/storage/supabase/`, and the shared client factory `src/lib/supabase/client.ts` —
    never from a route, component, or Server Action directly.
- `getDb()`/`getImageStorage()` are the only way UI code touches data/photos — no direct adapter
  imports from routes/components.
- Storefront routes live under the `(storefront)` route group (`src/app/(storefront)/`) so its
  layout (header/footer/mobile tab bar/WhatsApp button) never leaks into the admin panel. Admin
  itself splits `src/app/admin/login/` (unauthenticated) from `src/app/admin/(protected)/`
  (everything gated by `requireRole()` in that group's `layout.tsx`) — don't move a protected
  page out of that group, and don't put the login page inside it (redirect loop).
- Design tokens (colors, fonts, radii, shadows) live in `src/app/globals.css` under `@theme
  inline` — reuse `rounded-card`/`shadow-card`/`primary-*`/`accent-*` rather than inventing new
  one-off values, to keep the storefront visually consistent.
- The mock DB adapter stores its mutable state on `globalThis`, not a module-level `let` —
  Next.js compiles Route Handlers/Server Actions/RSC renders as separate module layers that
  don't otherwise share plain module state.
