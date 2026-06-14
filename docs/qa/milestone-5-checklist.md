# Milestone 5 QA Checklist

## Orders

- Buyer can see `/orders`.
- Buyer order detail shows items, delivery data, total, status history, and return area.
- Seller can see `/seller/orders`.
- Seller can update status and sees a visible confirmation.
- Buyer sees the updated status after reload.
- Admin can expand orders in `/admin`, inspect buyer/products/delivery/history/returns, and update status.
- Order statuses shown to users are Spanish labels, not raw codes.

## Returns

- Buyer can request a return only for a delivered order.
- Duplicate return requests for the same order are rejected.
- Buyer can view own returns in `/returns`.
- Seller can view only relevant product returns in `/seller/returns`.
- Admin can list returns with buyer, order, products, reason, details, status, and date.
- Admin can set return status to `Solicitada`, `Aprobada`, `Rechazada`, or `Completada`.
- When admin marks a return completed, the order status becomes `Devuelto` and history is recorded.

## Admin

- Admin tabs load: Usuarios, Productores, Productos, Pedidos, Devoluciones.
- Admin user status can be changed.
- Admin temporary password reset still works for active users.
- Admin order and return updates show success or error banners.

## MVP Surface Cleanup

- Home featured products use real API products only.
- Home featured producers use real API producers only.
- No fake ratings, fake reviews, fake followers, or fake activity appear in active MVP screens.
- Footer links `/ayuda`, `/contacto`, `/terminos`, and `/privacidad` do not 404.
- Seller sidebar does not actively link to future-only followers/posts/stats/payments modules.

## Production

- `https://mercadoahora.com.ar` loads.
- `https://www.mercadoahora.com.ar` loads or redirects without SSL errors.
- `/storage/*` product images load.
- Resend password recovery email works.
- GitHub Actions deploy can SSH to VPS and run migrations.
