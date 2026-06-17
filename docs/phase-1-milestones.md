# Mercado Ahora - Phase 1 Milestones

## Phase 1 MVP Goal

Validate the marketplace loop: producers can publish real products, buyers can discover them, chat, favorite, add to cart or buy now, create manual orders, and request returns. Payments and shipping remain manually coordinated in Phase 1.

## Milestone 1 - Architecture And Foundation

Status: Complete

- Laravel backend, Next.js frontend, PostgreSQL, Docker, Sanctum auth foundation.
- Base database schema, models, roles, middleware, and REST API structure.
- Deployment structure with Docker Compose and Caddy.

## Milestone 2 - Registration And Access

Status: Complete

- Buyer registration and login.
- Seller registration/application and producer profile.
- Existing buyer can apply to become producer.
- Admin role access.
- Email verification and password recovery through Resend.
- Admin temporary password reset backup.
- Stale-while-revalidate auth hydration to reduce "Validando sesión..." waits.

## Milestone 3 - Producer Products And Catalog

Status: Complete

- Seller product creation, edit, delete/pause, publish, stock, visibility status.
- Product image upload.
- Categories and subcategories.
- Public catalog, category listing, product search, province filters with counts.
- Product image/location fallback from producer profile when needed.
- Seller product list and validation before publishing.
- No fake product data on production UI unless demo fallback is explicitly enabled.

## Milestone 4 - Product Detail, Chat, Cart, Checkout

Status: Complete for Phase 1 MVP

- Product detail page.
- Product favorites system.
- Product-linked buyer/producer chat.
- Order-linked chat from seller order detail.
- Public browsing for product and producer pages, with login required only for protected interactions.
- Buy now flow.
- Add to cart flow.
- Shopping cart page.
- Checkout from cart.
- Checkout recovery when stock changes, including inline quantity adjustment, remove item, and `Ajustar al stock disponible`.
- Order creation from buy now and cart.
- Stock validation and decrement at order creation.
- Buyer and seller order views.

Limitations:

- Chat does not include real-time push notifications.
- Payments are manual, not Mercado Pago capture.
- Shipping labels are not integrated.

## Milestone 5 - Orders, Returns, Admin, MVP Delivery

Status: Complete for Phase 1 MVP

- Buyer order detail with items, delivery data, total, status history, and return action.
- Seller order detail with buyer, products, delivery data, status updates, confirmation, history, and buyer chat.
- Admin order expandable detail with buyer, products, delivery, totals, history, returns, note, and status update.
- Basic return flow:
  - Buyer can request one return per delivered order.
  - Buyer can view returns in `/returns`.
  - Seller can view returns related to their products in `/seller/returns`.
  - Admin can approve, reject, or complete returns.
  - Completed return marks the order as `returned` and writes status history.
- Admin users, producers, products, orders, and returns tabs.
- Admin product moderation now shows producer business name, user name, email, producer-specific publication filtering, edit/status/delete actions, correction notes, and audit logging.
- Footer pages added: `/ayuda`, `/contacto`, `/terminos`, `/privacidad`.
- Final docs added: `docs/MVP_DELIVERY_GUIDE.md`, `docs/qa/milestone-5-checklist.md`, `docs/resumen-hitos-mvp.md`, `docs/funcionalidades-implementadas.md`, `docs/manual-usuario-borrador.md`.

## Phase 1 Final MVP Limitations

- Manual payments only.
- Manual shipping coordination only.
- No reviews/ratings in MVP UI.
- No support ticket system.
- No advanced notifications center.
- Header message/cart previews are documented as UX improvements and can be expanded after MVP closure.
- No followers/posts/community module in active navigation.
- EcoScore is basic/manual and can be expanded later.

## Additional Scope Added During Client Feedback

The following items were introduced after the original milestone checklist and are now part of the Phase 1 implementation direction:

- Anonymous public browsing for product and producer pages.
- Redirect-back-after-login intent preservation for protected actions.
- Stronger commercial Spanish copy cleanup across the purchase funnel.
- SEO/indexability direction for public marketplace pages.

Future follow-up work related to that SEO direction is still pending and out of scope for this pass:

- richer metadata for products and producers,
- structured data,
- canonical handling,
- share-preview hardening.

## Verification

- Backend tests: `php -d memory_limit=-1 artisan test`
- Frontend lint: `npm run lint`
- Frontend build: `npm run build`
- Production smoke: apex domain, www domain, API health, storage images, Resend emails, login, search, checkout, seller orders, admin returns.
