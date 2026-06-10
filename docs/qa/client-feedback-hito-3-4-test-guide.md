# Mercado Ahora - Client Feedback Hito 3/4 Test Guide

Use this guide to test the changes requested in the client message about buyer search, seller profile, EcoScore, seller navigation, product form UX, public links, and mobile readability.

Important: the latest code is committed and pushed, but production may not contain it until the GitHub Actions SSH deploy succeeds. If production still shows old "Proximamente Hito 3" screens, test locally first.

## Current Code Coverage

| Client point | Code status | Main files |
| --- | --- | --- |
| 1. Product search for terms like "miel" | Implemented in frontend using `getProducts({ q, category, province })` | `frontend/src/app/buscar/page.tsx`, `frontend/src/lib/api.ts` |
| 2. Header/search icon no longer points to placeholder | Implemented: header and home search go to `/buscar` | `frontend/src/components/layout/SiteHeader.tsx`, `frontend/src/components/home/HeroSection.tsx` |
| 3. Seller public profile edit | Implemented for basic profile fields and social links. Logo upload is display-only/deferred. | `frontend/src/app/seller/profile/page.tsx`, `frontend/src/components/seller/SellerProfileForm.tsx`, `frontend/src/lib/api.ts` |
| 4. EcoScore explanation | Implemented as an informational seller page with score starting from real product data or `0` | `frontend/src/app/seller/ecoscore/page.tsx` |
| 5. Back to seller panel button | Implemented through reusable `SellerBackLink` on seller internal pages touched in this block | `frontend/src/components/seller/SellerBackLink.tsx` |
| 6. Mobile home hero readability | Improved with stronger mobile overlay | `frontend/src/components/home/HeroSection.tsx` |
| 7. Product name/action links to publication | Implemented in seller products table | `frontend/src/app/seller/products/page.tsx` |
| 8. Edit icon changed from search to pencil | Implemented through `EditIcon` | `frontend/src/components/ui/Icons.tsx`, `frontend/src/app/seller/products/page.tsx` |
| 9. Availability date removed | Removed from product form | `frontend/src/components/seller/ProductForm.tsx` |
| 10. Duplicate organic/agroecological field removed | Separate radio group removed; production method remains as one field | `frontend/src/components/seller/ProductForm.tsx` |
| 11. Price in pesos, not centavos | Implemented in UI; frontend converts pesos to `price_cents` before API submit | `frontend/src/components/seller/ProductForm.tsx` |
| WhatsApp `www` link issue | Caddy config updated to handle `www` and redirect to apex, but requires successful VPS deploy and Cloudflare DNS | `deploy/Caddyfile`, `frontend/src/app/layout.tsx` |

## Pre-Test Checklist

1. Confirm whether you are testing local or production.
2. If testing production, confirm latest deploy succeeded. The latest tested commit was pushed, but deploy can fail if GitHub Actions cannot SSH to the VPS on port `22`.
3. Have these accounts ready:
   - Buyer account.
   - Approved seller/producer account.
   - Admin account if you need to approve producer/products.
4. Have at least one active product named or described with a searchable term like `miel`.
5. Use mobile viewport or a real phone for mobile checks.

## Local Test Setup

From the repository root:

```bash
cd frontend
npm run lint
npm run build
npm run dev
```

Then open:

```text
http://localhost:3000
```

If the frontend uses the production API, make sure `frontend/.env.local` points to the intended backend.

## 1. Product Search

Goal: `/buscar` should show real product results instead of the old "Proximamente Hito 3" placeholder.

Steps:

1. Open `/buscar`.
2. Search for `miel`.
3. Confirm the page title changes to `Resultados para "miel"`.
4. Confirm product cards render when matching active products exist.
5. Click one product card.
6. Confirm it opens `/products/[slug]`.
7. Search for a term that should not exist.
8. Confirm the empty state says no products were found and offers category exploration.

Expected result:

- No "Proximamente Hito 3" copy appears on `/buscar`.
- Search form submits to `/buscar?q=miel`.
- Product results link to product detail pages.

QA note:

- `getProducts()` has a frontend fallback to demo products if the API fails. During QA, check browser Network tab and confirm `/api/v1/products?q=miel` returns successfully, so you are not accidentally seeing fallback data.

## 2. Header Lupa And Home Search

Goal: both the header search icon and the home search bar should lead to usable search.

Steps:

1. Open home page `/`.
2. Type `miel` in the hero search input.
3. Press `Buscar`.
4. Confirm browser lands on `/buscar?q=miel`.
5. Open the header search icon/lupa.
6. Confirm it opens `/buscar`, not a placeholder page.

Expected result:

- Search is usable from home and header.
- No blocker page appears.

## 3. Seller Public Profile

Goal: `/seller/profile` should allow real editing of basic public seller information.

Steps:

1. Login as an approved seller.
2. Open `/seller/profile`.
3. Confirm the page shows an editable form, not an informational placeholder.
4. Edit:
   - Business name.
   - Province.
   - City.
   - Description.
   - Story.
   - Production origin.
   - Production method.
   - Product types.
   - Production practices.
   - Public additional information.
5. Add social/contact links:
   - WhatsApp number or `https://wa.me/...`
   - Instagram.
   - Facebook.
   - Website.
6. Click `Guardar perfil publico`.
7. Refresh the page.
8. Confirm saved values persist.

Expected result:

- Form saves through seller profile/social link API calls.
- Completion percent changes based on filled fields.
- WhatsApp number without URL normalizes to a `wa.me` link.

Known limitation:

- Logo/photo upload is not implemented in this block. The page only displays an existing `logo_path` if one exists and shows a deferred message otherwise.

## 4. EcoScore

Goal: `/seller/ecoscore` should explain the EcoScore and show a real/current score.

Steps:

1. Login as seller.
2. Open `/seller/ecoscore`.
3. Confirm the page explains:
   - What EcoScore is.
   - How it increases.
   - Benefits for the producer.
   - Future levels/insignias.
4. Confirm the score is `0 / 100` or a computed average from product `ecoscore_points`.
5. Confirm the page has `Volver al panel del productor`.

Expected result:

- No generic "Proximamente disponible" page.
- Score starts from real product data, not fake dashboard data.

## 5. Seller Internal Navigation

Goal: seller internal pages should provide a visible return path.

Steps:

1. Open these seller routes while logged in as seller:
   - `/seller/products`
   - `/seller/orders`
   - `/seller/profile`
   - `/seller/ecoscore`
   - `/seller/stats`
   - `/seller/followers`
   - `/seller/posts`
   - `/seller/pagos`
2. Confirm each internal page has a visible `Volver al panel del productor` link or equivalent return link.
3. Click the link.
4. Confirm it returns to `/seller`.

Expected result:

- Seller can always return to the main seller panel.

## 6. Mobile Home Hero Readability

Goal: mobile hero text should remain readable over the background image.

Steps:

1. Open `/` on a phone or mobile viewport around `390x844`.
2. Check the headline, supporting copy, search form, and value points.
3. Scroll slowly and inspect if text overlaps unreadable parts of the image.

Expected result:

- A cream overlay makes text readable.
- Search bar remains usable.
- No major text/image overlap.

## 7. Seller Product Publication Access

Goal: sellers can see exactly how their product appears to buyers.

Steps:

1. Login as seller.
2. Open `/seller/products`.
3. Find any product row.
4. Click the product name.
5. Confirm it opens `/products/[slug]`.
6. Return to `/seller/products`.
7. Click the eye icon action.
8. Confirm it opens the same public product page.

Expected result:

- Product name is clickable.
- Eye icon is the "view publication/catalog" action.

## 8. Product Action Icons

Goal: edit action should use a pencil/edit icon, not a search icon.

Steps:

1. Open `/seller/products`.
2. Inspect the product row action icons.
3. Confirm:
   - Eye icon means view.
   - Pencil icon means edit.
   - Pause icon pauses active products.
   - Check icon publishes draft/paused products.
   - Trash icon deletes or pauses depending on order history.

Expected result:

- The edit action is visually clear.

## 9. Product Form - Availability Date Removed

Goal: seller should not be forced to enter a manual availability date.

Steps:

1. Open `/seller/products`.
2. Click `Nuevo producto`.
3. Review the product form.
4. Confirm there is no `Fecha de disponibilidad` field.
5. Create or edit a product without entering any date.

Expected result:

- Availability is handled by product status and creation/update flow, not manual date input.

## 10. Product Form - Organic/Agroecological Duplication Removed

Goal: the form should ask production classification only once.

Steps:

1. Open the product form.
2. Confirm there is no separate radio group asking `Es organico / agroecologico?`.
3. Go to `Detalles adicionales`.
4. Confirm there is one `Metodo de produccion` select.
5. Choose one value such as `Organico`, `Agroecologico`, `Natural`, `Artesanal`, or `Regional`.
6. Save/publish.
7. Reopen edit mode and confirm the selected value persists.

Expected result:

- No duplicate organic/agroecological question.
- The production method field is the single source.

## 11. Product Form - Price In Pesos

Goal: sellers enter prices in Argentine pesos while backend still receives cents.

Steps:

1. Open `/seller/products`.
2. Click `Nuevo producto`.
3. In `Precio`, enter `5000`.
4. Confirm helper text shows a human price like `$ 5.000` and says the price is in pesos argentinos.
5. Save/publish.
6. Reopen product list.
7. Confirm the displayed price is `$ 5.000`, not `$ 50` and not a centavos instruction.
8. If possible, inspect the API payload and confirm `price_cents` is `500000`.

Expected result:

- Seller-facing input works in pesos.
- Backend storage remains `price_cents`.

## 12. WhatsApp Shared Link / `www` Domain

Goal: links shared as `www.mercadoahora.com.ar` should not break.

Steps after successful deploy:

1. Confirm Cloudflare has a DNS record for `www`.
2. Open:

```text
https://www.mercadoahora.com.ar
```

3. Confirm it redirects to:

```text
https://mercadoahora.com.ar
```

4. Share `https://www.mercadoahora.com.ar` in WhatsApp.
5. Tap the link from WhatsApp mobile.
6. Confirm it opens the site without certificate or Cloudflare errors.
7. Confirm the preview uses Mercado Ahora metadata/logo.

Expected result:

- `www` redirects to apex.
- WhatsApp link opens normally.

Current deployment note:

- This code is present in `deploy/Caddyfile`, but production will keep failing on `www` until the VPS deploy succeeds and Caddy reloads with the new config.

## Copy/Encoding QA

During code inspection, several touched files currently show mojibake strings such as:

- `CatÃ¡logo`
- `InformaciÃ³n`
- `CategorÃ­a`
- `pÃºblico`
- `Â¿QuÃ© estÃ¡s buscando?`

Functional testing can continue, but before client-facing QA these should be cleaned to proper Spanish UTF-8 text.

## Final Acceptance Checklist

- `/buscar?q=miel` shows real products or a real empty state.
- Header lupa opens `/buscar`.
- Home search submits to `/buscar`.
- Seller profile form saves and persists.
- EcoScore page explains the system and shows real/current score.
- Seller internal pages include `Volver al panel del productor`.
- Mobile hero text is readable.
- Seller product name and eye action open public product detail.
- Edit action uses pencil icon.
- Product form has no availability date field.
- Product form has no duplicate organic/agroecological radio group.
- Product price is entered in pesos and converted to cents internally.
- `https://www.mercadoahora.com.ar` redirects or loads correctly after deploy.
- No visible mojibake remains in client-facing pages.

