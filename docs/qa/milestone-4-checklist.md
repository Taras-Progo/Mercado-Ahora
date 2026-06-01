# Milestone 4 Checklist

**Product Page, Chat and Purchase Flow**  
*Checked against repo on 2026-05-26. `[x]` = implemented (backend and/or tests). `[ ]` = not done or frontend still placeholder.*

**Requires Milestone 3 closed first** (at least one active product visible in catalog).

---

## Milestone 4

### Backend — public product & producers

- [x] ~~`GET /api/v1/products/{slug}` — product detail (producer, category, images)~~
- [x] ~~`GET /api/v1/products/{slug}/related` — related products~~
- [x] ~~`GET /api/v1/producers` — active producers list~~
- [x] ~~`GET /api/v1/producers/{id}` — producer public profile~~
- [x] ~~`GET /api/v1/search/products` and `/search/producers`~~

### Backend — chat

- [x] ~~`GET /api/v1/conversations` — list conversations~~
- [x] ~~`POST /api/v1/conversations` — start conversation~~
- [x] ~~`GET /api/v1/conversations/{id}` — conversation detail~~
- [x] ~~`GET /api/v1/conversations/{id}/messages` — message history~~
- [x] ~~`POST /api/v1/conversations/{id}/messages` — send message~~
- [x] ~~`POST /api/v1/conversations/{id}/stock-question` — stock question shortcut~~
- [x] ~~Models: Conversation, Message, MessageAttachment (DB)~~
- [ ] Automated tests for chat create/send

### Backend — cart

- [x] ~~`GET /api/v1/cart` — view cart~~
- [x] ~~`POST /api/v1/cart/items` — add item~~
- [x] ~~`PATCH /api/v1/cart/items/{id}` — update quantity~~
- [x] ~~`DELETE /api/v1/cart/items/{id}` — remove item~~
- [x] ~~`PATCH /api/v1/cart/delivery` — delivery type on cart~~
- [x] ~~`POST /api/v1/cart/checkout-preview` — preview totals~~
- [x] ~~Cart item price/name snapshots~~

### Backend — checkout & orders (buyer)

- [x] ~~`POST /api/v1/checkout/buy-now` — direct purchase~~
- [x] ~~`POST /api/v1/checkout/cart` — checkout from cart~~
- [x] ~~Orders split by producer (one order per producer)~~
- [x] ~~Order number format `MA-YYYYMMDD-XXXXXX`~~
- [x] ~~`GET /api/v1/orders` — buyer order list~~
- [x] ~~`GET /api/v1/orders/{id}` — order detail~~
- [x] ~~`GET /api/v1/orders/{id}/tracking` — tracking endpoint~~

### Backend — seller orders

- [x] ~~`GET /api/v1/seller/orders` — seller order list~~
- [x] ~~`GET /api/v1/seller/orders/{id}` — seller order detail~~
- [x] ~~`PATCH /api/v1/seller/orders/{id}/status` — update order status~~

### Backend — payments (prepared only)

- [x] ~~`POST /api/v1/orders/{id}/payment-intent` — payment intent placeholder~~
- [x] ~~`GET /api/v1/orders/{id}/payment` — payment status~~
- [x] ~~Webhook route prepared~~
- [ ] Real Mercado Pago capture (future / Milestone 5)

### Backend — tests

- [x] ~~Test: buyer login + add to cart~~
- [x] ~~Test: checkout splits orders by producer~~
- [x] ~~Test: cart/checkout keeps price snapshot when product price changes~~
- [ ] Test: buy-now flow
- [ ] Test: chat conversation flow

### Frontend — product page (design priority)

- [ ] `/products/{slug}` — load product from API (page is placeholder)
- [ ] Product gallery / images
- [ ] Primary CTA: **Consultar al productor** (opens chat)
- [ ] Secondary CTA: **Comprar ahora** (buy-now flow)
- [ ] Tertiary CTA: **Ver perfil del productor**
- [ ] Producer story snippet on product page
- [ ] Related products section from API

### Frontend — producer public profile

- [ ] `/productores/{id}` — public producer profile page (route may not exist)
- [ ] Producer story, location, other products
- [ ] Link from product page to producer profile

### Frontend — chat

- [ ] `/chat` — conversation list from API
- [ ] Message thread view
- [ ] Send message from UI
- [ ] Open chat from product page “Consultar al productor”
- [ ] Seller can read/reply in chat from UI
- [ ] Chat refresh / polling (acceptable for M4 per architecture)
- [x] ~~`/chat` route exists (placeholder today)~~

### Frontend — cart & checkout

- [ ] `/cart` — show cart items from API
- [ ] Update quantity / remove item in UI
- [ ] Subtotals per producer (if shown in design)
- [ ] `/checkout` — checkout preview and confirm
- [ ] Order confirmation after checkout
- [x] ~~`/cart` and `/checkout` routes exist (placeholders today)~~

### Frontend — orders (buyer)

- [ ] `/orders` — list buyer orders from API
- [ ] Order detail view
- [x] ~~`/orders` route exists (placeholder today)~~

### Frontend — search & discovery

- [ ] `/buscar?q=` — product and producer results from API
- [x] ~~Hero search form submits to `/buscar` (destination is placeholder)~~
- [ ] Header cart icon shows item count when cart has items

### Frontend — seller (orders from M4)

- [ ] Seller orders list from API (dashboard uses static demo orders)
- [ ] Seller can view order detail
- [ ] Seller can update order status from UI

### Milestone 4 closure

- [ ] End-to-end demo: consult → chat → buy now → order visible
- [ ] End-to-end demo: add to cart → checkout → order(s) visible
- [ ] Milestone 4 client demo
- [ ] Milestone 4 QA sign-off

---

## Notes

| Area | Status |
|------|--------|
| **Backend** | ~95% — chat/order/cart/checkout APIs implemented and partially tested |
| **Frontend** | ~10% — cart, chat, checkout, orders, product page are placeholders |
| **Blocker for client** | Cannot validate purchase or chat flows from UI until pages call the API |

**Out of scope for Milestone 4 (Milestone 5 or Phase 2+):**

- Returns UI full flow (`POST /orders/{id}/returns` exists in API → M5)
- Full admin panel for orders/products
- Email notifications for orders/messages
- WebSocket real-time chat (polling OK for M4)
- Reviews on product page
- Live Mercado Pago payment
