# Milestone 3 Checklist

**Product Register by Seller and Catalog Structure**  
*Checked against repo on 2026-05-26. `[x]` = implemented (backend and/or tests). `[ ]` = not done or frontend still placeholder.*

**Requires Milestone 2 closed first** (auth, roles, admin seller approval).

---

## Milestone 3

### Backend — catalog & categories

- [x] ~~Category model (hierarchy via `parent_id`)~~
- [x] ~~Categories seeded (8 initial categories)~~
- [x] ~~`GET /api/v1/categories` — list active categories~~
- [x] ~~`GET /api/v1/categories/{slug}` — category detail~~
- [x] ~~`GET /api/v1/categories/{slug}/products` — products by category~~
- [ ] Subcategories exposed in API/UI (structure exists; not fully used in seed or frontend)

### Backend — product model & seller APIs

- [x] ~~Product model (price in cents, ARS, stock, slug, status, EcoScore fields)~~
- [x] ~~Product ↔ category ↔ producer relations~~
- [x] ~~`ProductImage` model and table (DB ready)~~
- [x] ~~`GET /api/v1/seller/products` — list seller products~~
- [x] ~~`POST /api/v1/seller/products` — create product~~
- [x] ~~`GET /api/v1/seller/products/{id}` — show product~~
- [x] ~~`PATCH /api/v1/seller/products/{id}` — update product~~
- [x] ~~`DELETE /api/v1/seller/products/{id}` — pause (soft delete)~~
- [x] ~~`PATCH /api/v1/seller/products/{id}/pause` — pause product~~
- [x] ~~`PATCH /api/v1/seller/products/{id}/publish` — publish as active~~
- [x] ~~Pending / non-approved seller cannot publish `active` products (403)~~
- [x] ~~Stock validation (`min: 0`)~~
- [x] ~~Seller dashboard API reports `can_publish_products` and product counts~~
- [ ] Product image upload API (no upload endpoint in routes yet)
- [ ] Image attach on create/update product (URLs or upload flow)

### Backend — public catalog

- [x] ~~`GET /api/v1/products` — public list (`active` only, filters: `q`, `category`, `province`, `production_type`)~~
- [x] ~~Only `active` products visible publicly~~
- [x] ~~Demo products seeded for approved seller~~

### Backend — tests

- [x] ~~Test: public categories and products return seeded data~~
- [x] ~~Test: pending seller cannot publish active product~~
- [x] ~~Test: admin approves seller → seller can create active product~~
- [ ] Dedicated tests for pause/publish/update product CRUD

### Frontend — seller product management

- [ ] `/seller/products` — create product form (wired to API)
- [ ] `/seller/products` — edit product (wired to API)
- [ ] `/seller/products` — list products from API (not static demo only)
- [ ] Pause / unpublish product from UI
- [ ] Pending seller sees clear block when trying to publish
- [x] ~~`/seller/products` route exists with `RoleGuard` (seller only)~~
- [ ] Product image upload or image URL field in form

### Frontend — public catalog & home

- [ ] `/categorias` — categories loaded from API
- [ ] `/categorias/{slug}` — products from API for that category
- [ ] Home “Explorá por categorías” uses API categories (currently hardcoded slugs; may not match DB)
- [ ] Home “Productos destacados” from API with link to `/products/{slug}`
- [ ] `/productores` — producer directory from API
- [ ] `/buscar` — search results from API (page is placeholder)
- [x] ~~Category and product routes exist (no 404) — placeholder pages today~~

### Frontend — seller dashboard (catalog-related)

- [ ] Seller dashboard “Mis productos” table from API (dashboard still uses static demo rows)
- [x] ~~Pending / rejected approval banners on `/seller`~~

### Milestone 3 closure

- [ ] Milestone 3 client demo (seller publishes → product visible in public category)
- [ ] Milestone 3 QA sign-off

---

## Notes

| Area | Status |
|------|--------|
| **Backend** | ~90% — missing image upload endpoint |
| **Frontend** | ~15% — mostly placeholders; API not wired on catalog/seller product UI |
| **Blocker for client** | They cannot validate M3 from the UI until seller product + category pages call the API |

**Out of scope for Milestone 3 (later milestones):**

- Full admin product moderation UI (partial API exists → Milestone 5)
- Reviews, favorites, notifications
- Advanced search and filters UI (basic search API exists → Milestone 4)
- Mercado Pago / real payments
