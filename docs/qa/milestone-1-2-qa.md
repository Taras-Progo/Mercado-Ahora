# Milestone 1 and 2 QA Notes

## Source Alignment

`Structure Design.docx` defines Phase 1 as the MVP stage with five milestones:

1. Project Baseline Architecture
2. User / Seller Registration and Access System
3. Product Register by Seller and Catalog Structure
4. Product Page, Chat and Purchase Flow
5. Orders, Returns, Admin and MVP Delivery

This QA note only covers Milestone 1 and Milestone 2.

## Milestone 1 Verification

- Architecture documentation is present in `/docs/architecture`.
- Client-deliverable DOCX architecture files are present in `/docs/architecture/docx`.
- HLD, LLD, module design, database design, API design, role system design, and future extension design are present.
- Setup documentation reflects the current Milestone 1 and Milestone 2 project status.
- Laravel backend and Next.js frontend structure are present.
- PostgreSQL local and production setup are documented.
- Future extensions are documented as prepared architecture, not implemented Phase 2/3 scope.

## Milestone 2 Verification

- Buyer registration endpoint exists and returns a token.
- Seller registration endpoint exists and creates a producer profile.
- Seller producer profile starts as `pending`.
- Login endpoint returns user and token.
- Logout endpoint revokes the current token.
- `/auth/me` supports session restoration after page refresh.
- Authenticated frontend calls include the bearer token.
- Backend role middleware protects buyer/seller/admin route groups.
- Admin is not allowed to act as buyer or seller.
- Seller-only frontend pages are protected by `<RoleGuard roles={["seller"]}>` and unauthorized users are redirected to login.
- Admin frontend area is protected by `<RoleGuard roles={["admin"]}>`.
- Buyer/seller marketplace areas are protected.
- Admin can approve or reject producer profiles from the new `/admin` UI.
- Pending seller cannot publish active products.
- Producer status (pending / approved / rejected) is read from the user object returned by `/auth/me` and surfaced as a banner on the seller dashboard.
- Email verification endpoint is present as a prepared placeholder.
- Password reset endpoints are present as prepared placeholders.
- Frontend `/recuperar` page calls the password-reset placeholder endpoint and informs the user that real email delivery is a later milestone.
- Frontend `/verificar-email` page documents the prepared verification flow.
- Authenticated dashboards show a dismissible "Verificá tu email" banner when `email_verified_at` is null, with a one-click resend that hits the prepared backend endpoint.

## Automated Verification

- Frontend lint: passed.
- Frontend build: passed.
- Backend PHPUnit suite: passed.
- Backend tests include buyer registration/login/logout, seller registration, pending producer profile, admin approval, route guards, and auth placeholders.

## Manual QA Checklist

- Buyer can register from frontend (`/register`).
- Buyer can log in from frontend (`/login`).
- Buyer remains logged in after page refresh (token + `/auth/me`).
- Buyer can access buyer areas such as cart and orders.
- Seller can submit producer postulation from frontend (`/seller/apply`).
- Seller remains logged in after postulation.
- Seller can access seller dashboard (`/seller`, role-guarded).
- Seller dashboard shows pending approval state when profile is pending.
- Seller dashboard shows rejected state when profile is rejected.
- Pending seller cannot publish active products.
- Admin can log in from frontend.
- Admin can access admin page (`/admin`, role-guarded).
- Admin can approve producer profile from the admin UI.
- Admin can reject producer profile from the admin UI.
- Non-admin account is redirected to its own home when hitting `/admin`.
- Non-seller account is redirected to its own home when hitting `/seller`.
- Unauthenticated user hitting `/seller` or `/admin` is redirected to `/login?redirect=...`.
- `/recuperar` page accepts an email and shows the prepared-placeholder success message.
- `/verificar-email` page is reachable and links from authenticated dashboards via the banner.
- "Verificá tu email" banner is dismissible and only appears when `email_verified_at` is null.
- Logout clears the local session and removes role navigation.

## Known Milestone 2 Boundaries

- Email delivery is not implemented.
- Password reset email delivery is not implemented.
- Full product management, product image upload, chat, checkout completion, order lifecycle, reviews, notifications, support, wallet, and community features are not part of this milestone closure.
