# Milestone 3 and 4 QA Notes

## Source Alignment

`Structure Design.docx` and `docs/setup.md` define **Phase 1 (MVP)** as five milestones. This document covers **Milestone 3** and **Milestone 4** only.

| Milestone | Official name | Timeline (plan) |
|-----------|---------------|-----------------|
| **3** | Product Register by Seller and Catalog Structure | ~1 week |
| **4** | Product Page, Chat and Purchase Flow | ~3 weeks |

**Prerequisites:** Milestone 2 must be closed (auth, roles, seller `pending`/`approved`, admin approve/reject) before signing off M3/M4.

**Related docs:** `docs/phase-1-milestones.md` (implementation tracker), `docs/architecture/05-estructura-api.md`, `Page Structure (1).txt` (product page UX priority).

---

## Milestone 3 — Product Register by Seller and Catalog Structure

### Goal

Approved sellers can create and manage products; buyers can browse a real catalog by category (public, active products only).

### Deliverables (scope)

- Seller: create, edit, delete (or pause), publish/unpublish products
- Product fields: name, description, price (ARS), stock, unit, category, province/city, production/delivery metadata, EcoScore fields
- Categories (and subcategories where applicable) seeded and exposed via API
- Product images (at least one primary image per product when publishing)
- Inventory: stock cannot go negative on publish/sale rules
- Visibility: only `active` products appear in public catalog; `pending` seller cannot publish `active` products
- Public: category list, products per category, product list with basic filters

### Backend verification

- [ ] `GET /api/v1/categories` returns active categories (seeded or admin-managed).
- [ ] `GET /api/v1/categories/{slug}` returns category detail.
- [ ] `GET /api/v1/categories/{slug}/products` returns only `active` products for that category.
- [ ] `GET /api/v1/seller/products` lists products for the authenticated seller (approved profile).
- [ ] `POST /api/v1/seller/products` creates a product linked to seller’s `producer_profile_id`.
- [ ] `GET /api/v1/seller/products/{id}` returns own product (403/404 for other sellers).
- [ ] `PATCH /api/v1/seller/products/{id}` updates allowed fields.
- [ ] `DELETE /api/v1/seller/products/{id}` or pause flow removes product from public catalog.
- [ ] `PATCH /api/v1/seller/products/{id}/pause` sets non-active visibility.
- [ ] `PATCH /api/v1/seller/products/{id}/publish` sets `active` only when seller profile is approved and stock/rules pass.
- [ ] Pending seller receives clear error when attempting to publish (API + UI).
- [ ] Product slug is unique; price stored in cents; currency ARS.
- [ ] Stock field validated (`>= 0`).
- [ ] EcoScore fields accept self-declared values; admin manual review endpoint exists if in scope for M3 (`PATCH /admin/products/{id}/ecoscore`) or deferred to M5 with UI note.

### Frontend verification

- [ ] `/seller/products` (or equivalent) is role-guarded (`seller` only).
- [ ] Approved seller sees product list from API (not static demo cards only).
- [ ] Seller can open create-product form and submit successfully; success feedback and list refresh.
- [ ] Seller can edit an existing product and save changes.
- [ ] Seller can pause/unpublish a product; it disappears from public listing after refresh.
- [ ] Seller with `pending` profile sees banner on dashboard and cannot publish active products (button disabled or API error surfaced).
- [ ] `/categorias` loads categories from API (not placeholder-only).
- [ ] `/categorias/{slug}` lists real products for that category from API.
- [ ] Home category cards link to `/categorias/{slug}` and show real data or empty state (not 404).
- [ ] Homepage “Productos destacados” uses API data or clearly labeled demo until API wired (document which).
- [ ] Product images display on seller form and public cards when URLs exist.
- [ ] Image upload works end-to-end OR documented interim (URL field / admin seed) with client sign-off.

### Manual QA checklist — Milestone 3

**Setup**

- [ ] Backend running (`php artisan serve` or production URL).
- [ ] Frontend `NEXT_PUBLIC_API_BASE_URL` points to API.
- [ ] DB migrated and seeded (`php artisan migrate --seed`).
- [ ] One **approved** seller account (e.g. `seller@mercadoahora.test` / `password` after seed).

**Seller product management**

- [ ] Log in as approved seller → open seller products page.
- [ ] Create product: name, description, price, stock, category, location → save → appears in seller list.
- [ ] Edit product → change price/stock/description → save → changes persist after reload.
- [ ] Pause product → no longer visible on public category/home listing.
- [ ] Publish product again → visible on public listing.
- [ ] Try create/publish while logged in as **pending** seller (new application) → blocked with clear message.

**Public catalog**

- [ ] Log out (or use incognito) → open `/categorias` → categories visible.
- [ ] Open a category → see active products from that seller (or empty state message).
- [ ] Product card shows name, price (ARS), image (if any), producer hint.

**Regression (M2)**

- [ ] Admin approve/reject still works.
- [ ] Buyer login and `/cuenta` still work.

### Known Milestone 3 boundaries (out of scope unless agreed)

- Full admin UI for category CRUD (API may exist; UI can be M5).
- Advanced search, filters, and sorting beyond basic category listing → **Milestone 4** (search) / **Phase 2** (advanced).
- Reviews, favorites persistence, notifications → Phase 2+.
- Mercado Pago / real payments → prepared structure only in Phase 1.
- AI category suggestion / fraud detection → future.

### Automated verification (M3)

- [ ] `php artisan test` includes seller product CRUD and public catalog tests (or add before closure).
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

---

## Milestone 4 — Product Page, Chat and Purchase Flow

### Goal

Buyers can discover products, open a product page aligned with design (consult producer first), chat with the producer, add to cart, checkout, and create orders. Sellers see resulting orders at a basic level.

### Deliverables (scope)

- Public product detail page (`/products/{slug}`) per `Page Structure (1).txt`:
  - Primary CTA: **Consultar al productor** (chat)
  - Secondary: **Comprar ahora**
  - Tertiary: **Ver perfil del productor**
- Producer public profile page
- Basic chat (buyer ↔ producer), text messages, list conversations
- Shopping cart (add/update/remove, delivery type on cart)
- Checkout preview and order creation (`buy-now` and `checkout/cart`)
- Orders grouped by producer where applicable
- Public search page with query param `?q=`
- Public producers directory

### Backend verification

- [ ] `GET /api/v1/products` — paginated active products; filters `q`, `category`, `province`, `production_type` work.
- [ ] `GET /api/v1/products/{slug}` — full detail including producer, category, images.
- [ ] `GET /api/v1/products/{slug}/related` — related products (optional empty OK).
- [ ] `GET /api/v1/producers` and `GET /api/v1/producers/{id}` — active producers only.
- [ ] `GET /api/v1/search/products` and `/search/producers` return results for sample queries.
- [ ] `GET /api/v1/cart` — buyer/seller cart (buyer flow primary).
- [ ] `POST /api/v1/cart/items` — add item with price snapshot.
- [ ] `PATCH /api/v1/cart/items/{id}` — update quantity.
- [ ] `DELETE /api/v1/cart/items/{id}` — remove item.
- [ ] `PATCH /api/v1/cart/delivery` — delivery preference stored.
- [ ] `POST /api/v1/cart/checkout-preview` — totals by producer.
- [ ] `POST /api/v1/checkout/buy-now` — creates order(s) with `MA-` order number.
- [ ] `POST /api/v1/checkout/cart` — checkout from cart (one order per producer if designed so).
- [ ] `GET /api/v1/orders` — buyer order list after checkout.
- [ ] `GET /api/v1/orders/{id}` — order detail.
- [ ] `POST /api/v1/conversations` — start conversation (buyer + producer context).
- [ ] `GET /api/v1/conversations` — list for current user.
- [ ] `GET /api/v1/conversations/{id}/messages` — message history.
- [ ] `POST /api/v1/conversations/{id}/messages` — send message.
- [ ] `POST /api/v1/conversations/{id}/stock-question` — optional quick question template.
- [ ] Seller: `GET /api/v1/seller/orders` returns orders after buyer checkout.

### Frontend verification

- [ ] `/products/{slug}` loads real product from API (not generic placeholder only).
- [ ] Product page button order matches design: consult (primary) > buy now (secondary) > producer profile (tertiary).
- [ ] **Consultar al productor** opens/creates chat and navigates to `/chat` (or inline panel) with correct producer.
- [ ] **Comprar ahora** triggers buy-now flow and creates order (with confirmation UI).
- [ ] **Ver perfil del productor** goes to `/productores/{id}` (or equivalent) with producer story, products, location.
- [ ] `/buscar?q=...` shows product/producer results from API (empty state if none).
- [ ] `/productores` lists producers from API.
- [ ] `/cart` shows line items, quantities, subtotals; update quantity works.
- [ ] `/checkout` completes checkout from cart and shows order confirmation / redirect to `/orders`.
- [ ] `/orders` lists buyer orders with status and totals.
- [ ] `/chat` lists conversations; selecting one shows messages; sending message works without full page reload (polling or refresh acceptable for M4).
- [ ] Header cart icon reflects item count when items in cart (optional but recommended).
- [ ] Unauthenticated user trying checkout is redirected to login with return URL.

### Manual QA checklist — Milestone 4

**Setup**

- [ ] Approved seller with at least one **active** product with stock > 0.
- [ ] Buyer account registered and logged in.

**Discovery**

- [ ] From home, open a featured product or category product → lands on `/products/{slug}`.
- [ ] Product page shows images, price in ARS, description, producer snippet.
- [ ] Click **Ver perfil del productor** → producer profile loads with their products.

**Chat**

- [ ] On product page, click **Consultar al productor** → conversation created or opened.
- [ ] Send message as buyer → message appears in thread.
- [ ] Log in as seller → open chat → see buyer message; reply → buyer sees reply (after refresh/poll).

**Buy now**

- [ ] Click **Comprar ahora** on product page → order created → visible under `/orders` with correct total and product name.
- [ ] Stock decreases or order validation prevents oversell (per business rules).

**Cart + checkout**

- [ ] Add two products (same or different producers) to cart from product pages or listing.
- [ ] Open `/cart` → correct items and quantities.
- [ ] Change quantity → totals update.
- [ ] Remove one item → cart updates.
- [ ] Proceed to `/checkout` → preview/confirm → place order → success.
- [ ] `/orders` shows new order(s); if multi-producer cart, confirm split behavior matches spec (one order per producer).

**Seller side**

- [ ] Log in as seller → seller orders view shows new order from buyer test.
- [ ] Seller can open order detail (basic fields: buyer, items, status, total).

**Search**

- [ ] Search from hero or `/buscar` for product name → finds seeded/active product.
- [ ] Search for producer business name → finds producer.

**Regression**

- [ ] M3 product pause → product not buyable / not in search results.
- [ ] M2 role guards: buyer cannot access `/seller` dashboard APIs via UI.

### Known Milestone 4 boundaries (out of scope unless agreed)

- Real-time WebSocket chat → polling/light refresh is acceptable for M4 per HLD.
- Mercado Pago payment capture → payment intent structure only; no live gateway in MVP.
- Email notifications for new order/message → Phase 2.
- Returns UI full flow → **Milestone 5** (API may exist).
- Full admin order management UI → **Milestone 5**.
- Reviews on product page → Phase 2.
- Offers/negotiation in chat → future.
- Home “featured” curation algorithm → static/seed OK for MVP.

### Automated verification (M4)

- [ ] `php artisan test` covers: public product detail, cart add, checkout creates order, conversation create/send (extend `ExampleTest.php` or dedicated tests).
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

---

## Cross-milestone sign-off (M3 + M4)

Use this table when reviewing with the client:

| Flow | Milestone | Pass? |
|------|-----------|-------|
| Seller publishes product → appears in category | M3 | ☐ |
| Buyer opens product page (design order of CTAs) | M4 | ☐ |
| Buyer chats with producer | M4 | ☐ |
| Buyer buys via “Comprar ahora” | M4 | ☐ |
| Buyer buys via cart + checkout | M4 | ☐ |
| Seller sees order | M4 | ☐ |
| Admin still approves sellers (M2) | M2 | ☐ |

**Suggested demo accounts (after seed):**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@mercadoahora.test` | `password` |
| Seller (approved) | `seller@mercadoahora.test` | `password` |
| Buyer | `buyer@mercadoahora.test` | `password` |

---

## Relation to Phase 2 / Phase 3 (post-MVP)

Do not confuse **Milestone 3/4** (Phase 1 MVP) with **Phase 2** (reviews, notifications, support, advanced search) or **Phase 3** (followers, posts, community) in `docs/architecture/01-diseno-alto-nivel-hld.md`. Those are separate roadmap phases after the five MVP milestones are delivered.
