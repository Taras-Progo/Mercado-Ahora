# Milestone 3 and 4 QA Check Guide

Use this guide to validate each checkbox from Milestone 3 and Milestone 4 on production or local.

Production base URL:

- Frontend: `https://mercadoahora.com.ar`
- API: `https://mercadoahora.com.ar/api/v1`

Seed/demo accounts, if the seeded data is still present:

- Admin: `admin@mercadoahora.com` / `password`
- Seller: `finca@raicesverdes.com` / `password`
- Buyer: `maria@compradora.com` / `password`

If those accounts are not available, create:

- one buyer account,
- one seller/producer account,
- approve the seller from admin before testing seller product flows.

Before starting, open these health checks:

- `https://mercadoahora.com.ar/up` should return `200`.
- `https://mercadoahora.com.ar/api/v1/categories` should return JSON.
- `https://mercadoahora.com.ar/api/v1/products` should return products or an empty paginated response.

## Milestone 3

### Seller Product Creation

Steps:

1. Log in as an approved seller.
2. Open `/seller/products`.
3. Click `Nuevo producto`.
4. Fill `Información básica`: name, category, price, unit, stock.
5. Confirm the `Fotos del producto` section unlocks automatically.
6. Fill description and additional details.
7. Click `Publicar producto`.

Pass:

- Product appears in `/seller/products`.
- Product has the entered name, price, category, stock, and status.
- Public product page opens at `/products/{slug}` if status is active.

Fail:

- Seller sees a 404.
- Product cannot be saved.
- Product is created without seller ownership.
- Required validation errors are missing or unclear.

### Seller Product Edit

Steps:

1. Log in as seller.
2. Open `/seller/products`.
3. Click the edit action on an existing product.
4. Change price, stock, description, or category.
5. Click `Guardar cambios` or `Publicar producto`.
6. Reload the page.

Pass:

- Updated values persist after reload.
- Seller list reflects the new price/stock/status.
- Public detail page reflects changes if the product is active.

### Seller Product Delete / Pause

Steps:

1. Log in as seller.
2. Open `/seller/products`.
3. Click pause on an active product.
4. Open public catalog or direct product page.
5. Publish it again if needed.

Pass:

- Paused product status changes to `Pausado`.
- Paused product is not shown as a purchasable active product in public listings.
- Seller can publish it again from the dashboard.

Note:

- If hard delete exists only as API and not UI, mark UI delete as pending and pause as completed.

### Product Image Upload

Steps:

1. Start product creation from `/seller/products`.
2. Fill required basic fields.
3. Wait for the photos section to unlock.
4. Click an empty image slot.
5. Upload a JPG/PNG/WebP under 5 MB.
6. Upload a second image.
7. Mark a different image as primary.
8. Delete one image.

Pass:

- Upload slots are clickable on desktop and mobile.
- Uploaded image preview appears.
- Primary badge moves correctly.
- Deleted image disappears.
- Public product card/detail page shows the primary image.

API check:

- `GET /api/v1/products/{slug}` should include `images`.
- Image URL should load either through `/storage/...` or as a full remote URL.

### Categories Setup

Steps:

1. Open `/categorias`.
2. Open `https://mercadoahora.com.ar/api/v1/categories`.

Pass:

- Categories render in the page.
- API returns active categories with `id`, `name`, `slug`, and `description`.
- Category cards link to `/categorias/{slug}`.

### Subcategories Setup

Steps:

1. Check category dropdown in product creation.
2. Check `/api/v1/categories` for categories with `parent_id`.
3. Try selecting a subcategory when creating/editing a product.

Pass:

- Parent categories and subcategories are visible where available.
- Product can be assigned to a valid category/subcategory.
- Category listing still works after assignment.

Note:

- If the current dataset only uses parent categories, mark subcategory UI/API support as present but sample subcategory content as pending.

### Public Product Catalog

Steps:

1. Log out or use an incognito window.
2. Open `/`.
3. Open `/categorias`.
4. Open `/buscar`.
5. Open `/api/v1/products`.

Pass:

- Public users can browse products without login.
- Product cards show name, price, producer/category info, and image.
- Only active/public products are shown.

### Product Listing By Category

Steps:

1. Open `/categorias`.
2. Click a category card.
3. Compare with API: `/api/v1/categories/{slug}/products`.

Pass:

- Category page loads without 404.
- Product list is filtered to that category.
- Empty category shows a clean empty state, not an error.

### Basic Inventory / Stock Management

Steps:

1. Log in as seller.
2. Create or edit a product with stock `1`.
3. Log in as buyer.
4. Buy one unit with `Comprar ahora` or cart checkout.
5. Reopen seller product list or product detail.

Pass:

- Stock cannot be negative.
- Purchase validates requested quantity against available stock.
- After order creation, stock decreases by purchased quantity.
- Out-of-stock products cannot be purchased.

API check:

- Product response stock should change after successful checkout.

### Product Visibility Status

Steps:

1. Create product as seller.
2. Save as draft or leave unpublished if available.
3. Publish it.
4. Pause it.
5. Check public listings after each status.

Pass:

- `draft` is visible in seller dashboard only.
- `active` is visible publicly.
- `paused` is hidden or not purchasable publicly.
- Status labels show clearly in seller dashboard.

### Seller Product List In Dashboard

Steps:

1. Log in as seller.
2. Open `/seller/products`.
3. Confirm all owned products are listed.
4. Confirm no products from other sellers appear.

Pass:

- Product table shows image, name, category, price, stock, status, and actions.
- Seller can access edit/pause/publish from the list.

### Product Validation Before Publishing

Steps:

1. Try to create a product without name.
2. Try without category.
3. Try invalid/negative price.
4. Try invalid/negative stock.
5. Try publishing without required fields.

Pass:

- Validation blocks invalid products.
- Error messages are visible and understandable.
- Invalid products are not active in public catalog.

### Milestone 3 QA Completed

Mark complete only when:

- Product creation, edit, pause/publish, image upload, category listing, stock, status visibility, and validation have all passed on desktop and mobile.
- No Milestone 3 route returns unexpected 404.
- Known pending items are documented clearly.

## Milestone 4

### Product Detail Page With Defined UI/UX

Steps:

1. Open a product from home, category, search, or direct URL `/products/{slug}`.
2. Check desktop and mobile layouts.

Pass:

- Product image gallery renders.
- Product title, price, stock/unit, category, production type, seller info, and description are visible.
- Layout is readable on mobile without overlap.
- Product page has clear primary and secondary actions.

### Main Button: Contact / Chat With Producer

Steps:

1. Log in as buyer.
2. Open a product page that is not your own product.
3. Click `Consultar al productor`.

Pass:

- Buyer is taken to `/chat`.
- A conversation is created or existing conversation is opened.
- Chat is linked to the selected product.

### Secondary Button: Buy Now

Steps:

1. Log in as buyer.
2. Open an active product with stock.
3. Click `Comprar ahora`.
4. Complete any required delivery fields if prompted.

Pass:

- Order is created.
- Buyer sees order confirmation or is redirected to orders.
- Stock validation runs.
- Seller can see the order in `/seller/orders`.

### Basic Buyer-Producer Chat

Steps:

1. Buyer opens product page.
2. Buyer starts chat.
3. Buyer sends a test message.
4. Seller logs in and opens `/chat`.
5. Seller replies.

Pass:

- Both buyer and seller can see the conversation.
- Messages persist after page reload.
- Sender identity and timestamp are shown clearly.

### Chat Linked To Product

Steps:

1. Start chat from a product page.
2. Open the conversation.

Pass:

- Conversation includes product context.
- The selected product can be identified from the chat view or API conversation payload.
- Starting chat again from the same product does not create confusing duplicate conversations unless intended.

### Buy Now Flow

Steps:

1. Log in as buyer.
2. Open product detail.
3. Click `Comprar ahora`.
4. Submit purchase.
5. Open `/orders`.

Pass:

- One order is created for the product.
- Order status starts as `pending`.
- Buyer order page shows the order.
- Seller order page shows the received order.

### Add To Cart Flow

Steps:

1. Log in as buyer.
2. Open product detail.
3. Click `Agregar al carrito`.
4. Open `/cart`.

Pass:

- Product appears in cart.
- Quantity can be changed.
- Removing item works.
- Cart badge/count updates if implemented.

### Shopping Cart Page

Steps:

1. Open `/cart` as buyer.
2. Add at least one product.
3. Change quantity.
4. Remove product.
5. Re-add product and proceed to checkout.

Pass:

- Cart shows image, product name, price, quantity, subtotal, and total.
- Empty cart has a clear empty state.
- Quantity changes are persisted.

### Checkout Preparation

Steps:

1. Add product to cart.
2. Open `/checkout`.
3. Fill delivery type/address/city/province if available.
4. Review totals.

Pass:

- Checkout page loads cart items.
- Buyer can review order before confirmation.
- Manual payment/shipping copy is clear if payments and shipping labels are not integrated.

### Order Creation From Cart

Steps:

1. Add one or more products to cart.
2. Open `/checkout`.
3. Confirm checkout.
4. Open `/orders`.
5. Seller opens `/seller/orders`.

Pass:

- Checkout creates order(s).
- Buyer sees created order(s).
- Seller sees only orders for their own products.
- Cart is cleared or updated after successful checkout.

### Order Creation From Buy Now

Steps:

1. Open product detail.
2. Click `Comprar ahora`.
3. Confirm purchase.
4. Open `/orders`.

Pass:

- A single order is created for that product.
- Order item details match the selected product and quantity.
- Buyer and seller views both show the order.

### Product Stock Validation During Purchase

Steps:

1. Set product stock to a low value as seller.
2. Try to buy more than available quantity.
3. Buy an allowed quantity.
4. Try buying again after stock reaches zero.

Pass:

- Over-purchase is blocked.
- Valid purchase decreases stock.
- Out-of-stock item cannot be purchased.
- Error message is visible to buyer.

### Milestone 4 QA Completed

Mark complete only when:

- Product detail, chat, buy now, cart, checkout, buyer orders, seller orders, and stock validation pass on desktop and mobile.
- Buyer and seller can complete a manual-operation flow without payments/shipping integration.
- Any deferred payment/shipping/chat enhancements are documented as future scope.

## Final QA Evidence To Capture

For each passed item, capture:

- Screenshot or screen recording on desktop.
- Screenshot or screen recording on mobile.
- Account used and role.
- Product/order/conversation ID if available.
- Any known limitation or follow-up issue.

Recommended final smoke test:

1. Buyer logs in.
2. Buyer opens product detail.
3. Buyer starts chat and sends a message.
4. Buyer adds product to cart.
5. Buyer checks out.
6. Buyer confirms order in `/orders`.
7. Seller logs in.
8. Seller sees product in `/seller/products`.
9. Seller sees order in `/seller/orders`.
10. Seller updates order status.
