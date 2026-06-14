# Mercado Ahora MVP Delivery Guide

This guide describes the Phase 1 MVP as delivered. The MVP is a manual-payment marketplace: it records products, chats, carts, orders, statuses, and returns, while payment collection and shipping labels remain outside Phase 1.

## Buyer Guide

1. Register or log in as a buyer.
2. Search from `/buscar` or browse categories.
3. Open a product detail page to review producer, image, price, stock, location, and delivery information.
4. Save products with the favorite heart.
5. Contact the producer from product detail if coordination is needed.
6. Add products to cart or use `Comprar ahora`.
7. Complete checkout. The system creates a pending manual order and decrements stock immediately.
8. View orders in `/orders`.
9. When an order is delivered, request a return from the order detail if needed.
10. View return status in `/returns`.

## Seller Guide

1. Use the existing account and apply to become a producer from `/seller/apply`.
2. Complete the public producer profile in `/seller/profile`.
3. Wait for admin approval.
4. Create products from `/seller/products`.
5. Upload product images, set stock, category, price in ARS, visibility status, and production information.
6. Manage stock and product status from the product list.
7. View received orders in `/seller/orders`.
8. Update order status manually: pending, confirmed, processing, shipped, delivered, or cancelled.
9. Start an order-linked chat with the buyer from order detail.
10. View return requests related to your products in `/seller/returns`.

## Admin Guide

1. Open `/admin`.
2. Manage users: search users, update user status, and use temporary password reset when needed.
3. Review producers: approve or reject producer applications.
4. Review products: approve, reject, pause, activate, and validate EcoScore where needed.
5. Manage orders: expand order detail, view buyer/products/delivery/status history/returns, and update status.
6. Manage returns: view buyer, order, products, reason, details, status, and update return status.
7. When a return is marked completed, the related order becomes `returned` and a status history entry is created.

## Phase 1 Limitations

- Payments are manual. Mercado Pago or other live payment capture is not included.
- Shipping labels and carrier integrations are not included.
- Reviews and ratings are Phase 2.
- Notifications are limited; no real-time notification center is included.
- Followers, posts, advanced analytics, support tickets, and community features are future phases.
- EcoScore scoring is basic/manual and can be expanded later.

## Production Smoke Test

1. Open `https://mercadoahora.com.ar` and `https://www.mercadoahora.com.ar`.
2. Confirm `/api/v1/categories`, `/api/v1/products?q=miel`, and `/api/v1/catalog/filters?q=miel` return valid JSON.
3. Register a buyer, verify login, password reset, and favorites.
4. Register or use an approved seller, create a product with image and stock.
5. Search the product as a buyer and confirm image/location/province display.
6. Add to cart, checkout, and confirm the order appears for both buyer and seller.
7. Seller updates status and starts chat.
8. Buyer confirms status after reload and requests return when delivered.
9. Admin completes return and confirms order becomes returned.
