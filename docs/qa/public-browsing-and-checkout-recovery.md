# Public Browsing And Checkout Recovery QA

Use this note to validate the extra public-browsing and intent-preservation scope added during client feedback.

## Public Browsing

- Anonymous user can open featured product cards from the home page.
- Anonymous user can open featured producer cards from the home page.
- Anonymous user can browse:
  - `/buscar`
  - `/categorias`
  - `/products/[slug]`
  - `/productores`
  - `/productores/[id]`

## Protected Actions

- Anonymous user trying to start chat is redirected to login.
- Anonymous user trying to add to cart is redirected to login.
- Anonymous user trying to buy now is redirected to login.
- Anonymous user trying to save favorites is redirected to login.

## Redirect Preservation

- After login, the user returns to the exact original target instead of the generic panel.
- Query params are preserved through login.
- `/chat?producer=...` remains intact after authentication.

## Checkout Recovery

- If stock changed after adding items to cart, checkout returns `422`.
- The UI shows the affected rows only.
- User can reduce quantity inline.
- User can remove the product inline.
- User can use `Ajustar al stock disponible`.
- After correction and refresh, the order can be completed without leaving `/checkout`.
