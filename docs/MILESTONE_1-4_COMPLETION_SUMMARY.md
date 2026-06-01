# Mercado Ahora — Phase 1 Completion Summary (Milestones 1-4)

## Document Purpose
This document provides a comprehensive handoff for any developer or AI agent continuing work on the Mercado Ahora marketplace. It covers everything completed in Phase 1, Milestones 1 through 4.

---

## 1. Project Overview

**Mercado Ahora** is an Argentine marketplace for natural/ecological products connecting local producers with buyers. The platform supports three user roles: **buyer (comprador)**, **seller/producer (productor)**, and **admin**.

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.4 (App Router), React 19.2.4, TypeScript 5, Tailwind CSS 4 |
| Backend API | Laravel 13, PHP 8.3 |
| Authentication | Laravel Sanctum (token-based) |
| Database | PostgreSQL 16 |
| Containerization | Docker Compose (dev + prod) |
| Reverse Proxy (prod) | Caddy |
| Deploy | GitHub Actions → VPS at `/opt/mercado-ahora` |

### Design System
- **Color palette**: Olive green (`#4b5e40`, `#3d4f34`), cream (`#fdfbf7`, `#f2ebe1`, `#faf8f5`), brown (`#4a3728`, `#8b735b`, `#6b5a4a`)
- **Fonts**: Playfair Display (serif, headings), Inter (sans-serif, body)
- **Language**: All user-facing text in Spanish (es-AR)
- **Currency**: Argentine Pesos (ARS), prices stored in centavos (cents)
- **CSS**: Tailwind 4 with custom theme variables in `globals.css`
- **Button patterns**: `rounded-full`, `.btn-primary` (olive bg), olive border for secondary

---

## 2. Completed Milestones

### Milestone 1 — Project Baseline Architecture ✅
**Status**: COMPLETE

- GitHub repository setup
- Laravel 13 backend scaffolded with PostgreSQL
- Next.js 16 frontend scaffolded with App Router
- Docker Compose for development (PostgreSQL service)
- Role system designed: admin, seller, buyer
- Basic API structure with Sanctum auth
- Frontend layout components (SiteHeader, SiteFooter, AuthProvider)
- Design system established (Tailwind 4 theme, olive/brown/cream palette)

### Milestone 2 — User/Seller Registration and Access ✅
**Status**: COMPLETE

- User registration (buyer + seller)
- Login system with Sanctum tokens
- Role-based access control (middleware `role:buyer,seller,admin`)
- Email verification base (endpoint prepared)
- AuthProvider React context with `useAuth()` hook
- RoleGuard component for protected routes
- Route redirection by role (`roleHome()`)
- Auth token stored in localStorage as `mercado_token`
- Basic dashboard entry by role

### Milestone 3 — Product Register and Catalog ✅
**Status**: COMPLETE

- Seller product CRUD (create, edit, delete, pause, publish)
- Product image upload (FormData, multipart)
- Categories system (8 categories, hierarchical)
- Product catalog with filtering (category, search, province, production_type)
- Product pagination
- Producer profiles (6 seed producers with rich data)
- Product visibility status (active, paused, draft)
- EcoScore system (0-100, labels: Alto/Medio/Básico)
- Producer approval is the publication gate: a producer profile must be approved (`active`) by an admin before its products can be set `active` and appear in the catalog. Admin product moderation (`approve`/`reject`/`status`/`ecoscore`) is reactive (post-publication) rather than a pre-publication gate.
- 15 seed products (each with placeholder images) across 6 producers and 8 categories
- Seller dashboard (products list, profile editing)
- Frontend API client (`src/lib/api.ts`) with types and helpers

### Milestone 4 — Product Page, Chat, Purchase Flow ✅
**Status**: COMPLETE

#### Product Detail Page (`/products/[slug]`)
- Full product display: images, name, price, location, producer info, EcoScore, stock, delivery type, description
- **Primary action**: "Consultar al productor" (Chat with producer) — olive button, creates conversation via API
- **Secondary action**: "Comprar ahora" (Buy Now) — outlined button, opens modal with quantity selector
- **Tertiary action**: "Agregar al carrito" (Add to Cart) — subtle button
- Buy Now modal with quantity +/- (constrained by stock), price calculation, order confirmation
- Login prompt for unauthenticated users with redirect param
- Own-product detection (sellers see "Este es tu producto" instead of buy buttons)
- Related products section using backend `/products/{slug}/related` endpoint
- Cart feedback messages (success/error) with auto-dismiss

#### Shopping Cart (`/cart`)
- Full CRUD: list items, quantity +/- controls, remove items
- Stock validation on every quantity change (backend-enforced)
- Product images, producer names, unit prices, line totals
- Subtotal/total display with "A coordinar con el productor" for shipping
- "Ir al checkout" button
- Empty state with "Tu carrito está vacío"
- Protected by RoleGuard (buyer + seller)

#### Checkout (`/checkout`)
- Cart summary (read-only)
- Delivery form: tipo de entrega (select), provincia, ciudad, dirección, nota
- Order confirmation with per-order breakdown
- "Se generaron pedidos separados por productor" messaging
- Success state with order numbers, "Ver mis pedidos" / "Seguir comprando" buttons
- Empty cart protection
- Protected by RoleGuard

#### Orders (`/orders`)
- Expandable order cards with: order number, status badge, date, item count, total
- Expanded view: item list with product links, delivery info, status history timeline
- Totals breakdown (subtotal, shipping, total)
- Empty state: "No tenés pedidos todavía"
- Protected by RoleGuard

#### Chat / Conversations (`/chat`)
- Two-panel layout: conversation list (sidebar) + message area
- Conversation list shows: other party name, product name, last message preview, timestamp
- Message thread with own messages (olive, right-aligned) vs received (cream, left-aligned)
- Send message input with Enter/button
- Auto-polling every 5 seconds for new messages
- Auto-refresh conversation list every 10 seconds
- **Auto-create from producer profile**: detects `?producer=ID` query param and auto-opens conversation
- **Auto-create from product page**: when clicking "Consultar al productor", creates conversation with `product_id` link
- Seller sees buyer's actual name (loaded from `buyer` relation)
- Buyer sees producer's business name
- Conversation header shows linked product with price
- Protected by RoleGuard (buyer + seller)

---

## 3. Backend Architecture

### API Routes (`routes/api.php`)
All routes prefixed with `/api/v1`. Full list in `Mercado-Ahora-repo/backend/routes/api.php`.

**Public routes (no auth)**:
- `POST /auth/register`, `POST /auth/register-seller`, `POST /auth/login`
- `POST /auth/password/forgot`, `POST /auth/password/reset` (stub)
- `GET /categories`, `/categories/{slug}`, `/categories/{slug}/products`
- `GET /products`, `/products/{slug}`, `/products/{slug}/related`, `/products/{slug}/reviews`
- `GET /producers`, `/producers/{id}`
- `GET /search/products`, `/search/producers`
- `POST /payments/webhooks/{provider}`

**Authenticated routes** (`auth:sanctum` middleware):
- `POST /auth/logout`, `GET /auth/me`, `GET /users/me`
- `POST /auth/email/verify` (stub)

**Buyer + Seller routes** (`role:buyer,seller`):
- Cart: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/{id}`, `DELETE /cart/items/{id}`, `PATCH /cart/delivery`, `POST /cart/coupon` (stub), `POST /cart/checkout-preview`
- Checkout: `POST /checkout/buy-now`, `POST /checkout/cart`
- Orders: `GET /orders`, `GET /orders/{id}`, `GET /orders/{id}/tracking`, `POST /orders/{id}/returns`, `GET /returns`, `POST /orders/{id}/payment-intent`, `GET /orders/{id}/payment`
- Chat: `GET /conversations`, `POST /conversations`, `GET /conversations/{id}`, `GET /conversations/{id}/messages`, `POST /conversations/{id}/messages`, `POST /conversations/{id}/stock-question`

**Seller routes** (`role:seller`):
- Profile: `GET/POST/PATCH /seller/profile`, `GET/POST /seller/social-links`
- Products: `GET/POST /seller/products`, `GET/PATCH/DELETE /seller/products/{id}`, `PATCH /seller/products/{id}/pause`, `PATCH /seller/products/{id}/publish`
- Images: `POST /seller/products/{product}/images`, `PATCH/DELETE /seller/products/{product}/images/{image}`
- Orders: `GET /seller/orders`, `GET /seller/orders/{id}`, `PATCH /seller/orders/{id}/status`
- Returns: `GET /seller/returns`

**Admin routes** (`role:admin`):
- Users: `GET /admin/users`, `GET /admin/users/{id}`, `PATCH /admin/users/{id}/status`
- Producers: `GET /admin/producers`, `PATCH /admin/producers/{id}/status`, `PATCH /admin/producers/{id}/approve`, `PATCH /admin/producers/{id}/reject`
- Products: `GET /admin/products`, `PATCH /admin/products/{id}/approve`, `PATCH /admin/products/{id}/reject`, `PATCH /admin/products/{id}/status`, `PATCH /admin/products/{id}/ecoscore`
- Orders: `GET /admin/orders`, `GET /admin/orders/{id}`, `PATCH /admin/orders/{id}/status`
- Returns: `GET /admin/returns`, `PATCH /admin/returns/{id}/status`

### Controllers
| Controller | File Path | Responsibility |
|---|---|---|
| AuthController | `app/Http/Controllers/Api/AuthController.php` | Register, login, logout, me |
| CatalogController | `app/Http/Controllers/Api/CatalogController.php` | Products, categories, producers (public) |
| CartController | `app/Http/Controllers/Api/CartController.php` | Cart CRUD with stock validation |
| OrderController | `app/Http/Controllers/Api/OrderController.php` | Buy now, checkout, orders, stock validation + decrement |
| ChatController | `app/Http/Controllers/Api/ChatController.php` | Conversations, messages |
| SellerController | `app/Http/Controllers/Api/SellerController.php` | Seller products, profile, dashboard |
| AdminController | `app/Http/Controllers/Api/AdminController.php` | Admin management |
| ProductImageController | `app/Http/Controllers/Api/ProductImageController.php` | Product image CRUD |
| PaymentWebhookController | `app/Http/Controllers/Api/PaymentWebhookController.php` | Payment webhooks (stub) |

### Models (16)
| Model | Table | Key Relationships |
|---|---|---|
| User | users | hasOne ProducerProfile, hasMany Order, hasOne Cart |
| ProducerProfile | producer_profiles | belongsTo User, hasMany Product |
| Product | products | belongsTo Category, belongsTo ProducerProfile, hasMany ProductImage |
| Category | categories | hasMany Product |
| Cart | carts | belongsTo User, hasMany CartItem |
| CartItem | cart_items | belongsTo Cart, belongsTo Product |
| Order | orders | belongsTo User (buyer), hasMany OrderItem, hasMany OrderStatusHistory |
| OrderItem | order_items | belongsTo Order, belongsTo Product, belongsTo ProducerProfile |
| OrderStatusHistory | order_status_histories | belongsTo Order |
| PaymentIntent | payment_intents | belongsTo Order |
| Conversation | conversations | belongsTo User (buyer), belongsTo ProducerProfile, belongsTo Product, hasMany Message |
| Message | messages | belongsTo Conversation, belongsTo User (sender) |
| MessageAttachment | message_attachments | belongsTo Message |
| ProductImage | product_images | belongsTo Product |
| ProducerSocialLink | producer_social_links | belongsTo ProducerProfile |
| ReturnRequest | return_requests | belongsTo User (buyer), belongsTo Order |

### Stock Validation (Added in Milestone 4)
- `CartController::addItem()`: validates that (existing quantity + new quantity) ≤ product stock
- `CartController::updateItem()`: validates new quantity ≤ product stock
- `OrderController::buyNow()`: validates quantity ≤ product stock
- `OrderController::checkoutCart()`: validates each item quantity ≤ product stock AND product status === 'active'
- `OrderController::createOrder()`: decrements product stock within DB transaction after order creation
- All errors return Spanish messages like "Stock insuficiente. Solo quedan X disponibles."

### Database Seeder (`database/seeders/DatabaseSeeder.php`)
Seeds complete test data:
- **1 admin**: admin@mercadoahora.com / password
- **6 producers** with full profiles: Verde Amanecer, La Colmena Natural, Madera Viva, Tierra Adentro, Finca Raíces Verdes, Cerámicas del Valle
- **8 categories**: Alimentos naturales, Huerta, Bebidas, Cosmética, Bienestar, Hogar, Artesanías, Mascotas
- **15 products** (each with 2 placeholder images) across all producers and categories
- **2 buyers**: maria@compradora.com, juan@mercado.com
- **2 conversations** with 5 messages total (linked to products)
- **2 orders** with order items and status history (1 confirmed, 1 pending)
- All passwords: `password`

---

## 4. Frontend Architecture

### Key Files
| File | Purpose |
|---|---|
| `src/lib/api.ts` | TypeScript types for all models, API functions (public + authenticated), formatting helpers |
| `src/app/layout.tsx` | Root layout with AuthProvider, Tailwind globals |
| `src/app/globals.css` | Tailwind 4 theme, color variables, utility classes |
| `src/components/AuthProvider.tsx` | React context for auth state, login/logout/refresh |
| `src/components/RoleGuard.tsx` | Route protection with role check and redirect |
| `src/components/layout/SiteHeader.tsx` | Global header with nav, auth state, cart link |
| `src/components/layout/SiteFooter.tsx` | Global footer |
| `src/components/ui/Icons.tsx` | SVG icon components (30+ icons) |
| `src/components/ui/ProductCard.tsx` | Reusable product card for grids |

### API Client (`src/lib/api.ts`) — Key Functions

**Types defined**: `Category`, `ProducerProfile`, `Product`, `ProductImage`, `Order`, `CartItem`, `Cart`, `Conversation`, `Message`

**Public API helpers**:
- `apiGet<T>(path, fallback)` — Generic unauthenticated GET
- `getProducts(params?)`, `getProduct(slug)`, `getCategories()`, `getCategory(slug)`, `getProducers()`, `getProducer(id)`, `getRelatedProducts(slug)`

**Authenticated API helpers** (token from localStorage `mercado_token`):
- `authFetch()` — base auth fetch with Bearer token
- `apiAuthGet<T>()`, `apiAuthPost<T>()`, `apiAuthPatch<T>()`, `apiAuthDelete<T>()`

**Cart API**: `getCart()`, `addToCart(productId, quantity?)`, `updateCartItem(itemId, quantity)`, `removeCartItem(itemId)`

**Order API**: `buyNow(data)`, `checkoutCart(data)`, `getOrders()`, `getOrder(id)`

**Chat API**: `getConversations()`, `createConversation(data)`, `getConversation(id)`, `getMessages(conversationId)`, `sendMessage(conversationId, body)`

**Seller API**: `getSellerProducts()`, `getSellerProduct()`, `createProduct()`, `updateProduct()`, `deleteProduct()`, `publishProduct()`, `pauseProduct()`, `uploadProductImage()`, `updateProductImage()`, `deleteProductImage()`

**Formatting helpers**: `money(cents)`, `ecoLabel(score)`, `ecoColor(score)`, `statusLabel(status)`, `statusColor(status)`, `productionTypeLabel(type)`, `deliveryTypeLabel(type)`, `orderStatusLabel(status)`, `orderStatusColor(status)`, `imageUrl(path)`

### All Pages (app router)
| Route | File | Status |
|---|---|---|
| `/` | `page.tsx` | ✅ Home with Hero, categories, featured products/producers |
| `/categorias` | `categorias/page.tsx` | ✅ Category listing |
| `/categorias/[slug]` | `categorias/[slug]/page.tsx` | ✅ Products by category |
| `/products/[slug]` | `products/[slug]/page.tsx` | ✅ Full product detail + 3 action buttons |
| `/productores` | `productores/page.tsx` | ✅ Producer directory |
| `/productores/[id]` | `productores/[id]/page.tsx` | ✅ Producer profile with products + chat link |
| `/buscar` | `buscar/page.tsx` | ✅ Search page |
| `/cart` | `cart/page.tsx` | ✅ Full cart CRUD |
| `/checkout` | `checkout/page.tsx` | ✅ Checkout with delivery form |
| `/orders` | `orders/page.tsx` | ✅ Orders list with expandable details |
| `/chat` | `chat/page.tsx` | ✅ Two-panel chat with conversations + messaging |
| `/login` | `login/page.tsx` | ✅ Login form |
| `/register` | `register/page.tsx` | ✅ Registration choice |
| `/register/buyer` | `register/buyer/page.tsx` | ✅ Buyer registration |
| `/cuenta` | `cuenta/page.tsx` | ✅ Account page |
| `/seller` | `seller/page.tsx` | ✅ Seller dashboard |
| `/seller/products` | `seller/products/` | ✅ Seller product management |
| `/seller/profile` | `seller/profile/` | ✅ Seller profile editing |
| `/admin` | `admin/page.tsx` | ✅ Admin panel |
| `/favoritos` | `favoritos/page.tsx` | Placeholder (future) |
| `/como-funciona` | `como-funciona/page.tsx` | Info page |
| `/sobre-nosotros` | `sobre-nosotros/page.tsx` | About page |
| `/recuperar` | `recuperar/page.tsx` | Password recovery |
| `/verificar-email` | `verificar-email/page.tsx` | Email verification |

---

## 5. What Remains (Not Yet Implemented)

### Phase 1 — Milestone 5: Orders, Returns, Admin and MVP Delivery (2 weeks)
- Order management refinements
- Return management flow improvements
- Producer order view enhancements
- Admin panel improvements
- Testing and bug fixing
- VPS deployment preparation
- Final MVP documentation

### Phase 2 — Experience Improvement (4 weeks)
- Milestone 6: Reviews & Ratings System
- Milestone 7: Notification System
- Milestone 8: Support System (tickets)
- Milestone 9: Advanced Search & Filters

### Phase 3 — Community / Differentiation (4 weeks)
- Milestone 10: Producer Followers
- Milestone 11: Producer Posts/News
- Milestone 12: Social Interactions (comments, reactions)
- Milestone 13: Community Integration

### Not Implemented
- Reviews and ratings (Phase 2)
- Notifications center (Phase 2)
- Support tickets (Phase 2)
- Advanced search/filters beyond basic (Phase 2)
- Producer followers (Phase 3)
- Producer posts/news (Phase 3)
- Comments/reactions (Phase 3)
- Full Mercado Pago integration (payment prepared as stub only)
- Real-time chat (WebSockets) — current uses polling
- Offer/counteroffer system
- Image attachments in chat

---

## 6. How to Run

### Prerequisites
- Docker and Docker Compose
- Node.js 20+
- PHP 8.3+ with Composer (or use Docker)

### Quick Start (Development)

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Setup backend
cd Mercado-Ahora-repo/backend
composer install
cp .env.example .env
# Edit .env: set DB_HOST=127.0.0.1, DB_DATABASE=mercado_ahora, DB_USERNAME=mercado_ahora, DB_PASSWORD=mercado_ahora
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve

# 3. Setup frontend (in another terminal)
cd Mercado-Ahora-repo/frontend
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
npm install
npm run dev
```

### Production Deploy
See `DEPLOYMENT.md` for VPS deployment with Caddy + Docker Compose + GitHub Actions.

### Test Accounts (after seeding)
| Role | Email | Password |
|---|---|---|
| Admin | admin@mercadoahora.com | password |
| Buyer | maria@compradora.com | password |
| Buyer | juan@mercado.com | password |
| Seller | finca@raicesverdes.com | password |
| Seller | colmena@natural.com | password |
| Seller | verde@amanecer.com | password |
| Seller | madera@viva.com | password |
| Seller | tierra@adentro.com | password |
| Seller | ceramicas@valle.com | password |

---

## 7. Key Conventions for Future Development

### Frontend
- **"use client"** directive on all interactive pages
- Auth: use `useAuth()` hook, wrap protected pages with `<RoleGuard roles={[...]}>`
- API calls: use functions from `@/lib/api` (they handle tokens automatically)
- Styling: stick to the olive/brown/cream palette from `globals.css`
- Spanish language for ALL user-facing text
- Prices: always stored in centavos, display with `money(cents)` helper
- Login redirects: use `/login?redirect=${encodeURIComponent(path)}` pattern

### Backend
- Controllers in `app/Http/Controllers/Api/`
- Models in `app/Models/` with `#[Fillable]` attributes
- API responses use `response()->json(['data' => ...])` pattern
- Validation uses Laravel `$request->validate()`
- Auth: `$request->user()` for authenticated user
- DB transactions for order creation
- Stock validation: always check before creating/modifying cart items and orders