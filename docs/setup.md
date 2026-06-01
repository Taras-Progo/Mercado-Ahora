# Mercado Ahora - Setup and Milestone 1/2 Status

This repository contains the Phase 1 foundation for Mercado Ahora.

Phase 1 is defined as the MVP stage and is split into five milestones:

1. Milestone 1: Project Baseline Architecture
2. Milestone 2: User / Seller Registration and Access System
3. Milestone 3: Product Register by Seller and Catalog Structure
4. Milestone 4: Product Page, Chat and Purchase Flow
5. Milestone 5: Orders, Returns, Admin and MVP Delivery

This document reflects the current repository state after closing Milestone 1 and completing the main Milestone 2 access flow.

## Repository Structure

- `backend/`: Laravel API application.
- `frontend/`: Next.js App Router frontend application.
- `docs/`: project documentation, architecture design, role design, API design, database design, and QA notes.
- `deploy/`: VPS deployment scripts.
- `docker-compose.yml`: local PostgreSQL service.
- `docker-compose.prod.yml`: production Docker Compose stack for frontend, backend, PostgreSQL, and reverse proxy.

## Documentation Included

The `/docs/architecture` folder contains:

- High-level design (HLD)
- Low-level design (LLD)
- Module definition
- Complete database design
- API structure definition
- Base role system design for admin, seller, and buyer
- Future extension preparation for reviews, notifications, support, community, and future wallet

The `/docs/architecture/docx` folder contains the same architecture package in DOCX format for client delivery.

## Backend

The backend is a Laravel API configured for PostgreSQL and Sanctum token authentication.

Main backend areas currently prepared:

- Public catalog API base
- Buyer registration and login
- Seller registration / producer postulation
- Admin, seller, and buyer role middleware
- Seller profile creation with `pending` status
- Admin producer approval and rejection endpoints
- Cart price snapshot foundation
- Order grouping by producer foundation
- Email verification and password reset placeholders

Run the backend locally:

```bash
cd backend
php artisan serve
```

Run migrations (and seed demo data):

```bash
cd backend
php artisan migrate --seed
```

Link the public storage disk so uploaded product images are served at
`/storage/...`. This is required for seller-uploaded images to render
(seeded demo products use remote placeholder URLs and do not need it):

```bash
cd backend
php artisan storage:link
```

Run backend tests:

```bash
cd backend
php artisan test
```

## PostgreSQL

Local PostgreSQL can be started with Docker:

```bash
docker compose up -d postgres
```

Default local database values:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=mercado_ahora
DB_USERNAME=mercado_ahora
DB_PASSWORD=mercado_ahora
```

For production Docker deployment, database values are stored in `.env.production` on the VPS and are not committed.

## Frontend

The frontend is a Next.js App Router application.

Main frontend areas currently prepared:

- Product catalog base
- Buyer login and registration pages
- Seller postulation page
- Auth persistence after page refresh through stored token and `/auth/me`
- Role-based header navigation
- Protected frontend areas for buyer, seller, and admin sections
- Role-based dashboard entry
- Admin producer review UI with approve/reject actions
- Visible placeholders for email verification and password reset

The frontend reads the API base URL from:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Run the frontend locally:

```bash
cd frontend
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Milestone 1 Status

Milestone 1 is closed in the repository.

Completed:

- Architecture documentation is included under `/docs`.
- HLD, LLD, module design, database design, API design, role design, and future extension design are included.
- Laravel backend structure is present.
- Next.js frontend structure is present.
- PostgreSQL configuration is documented.
- Backend API base structure is documented.
- Frontend base structure is documented.
- Initial user model and role system are documented.
- Foundation for future extensions is documented without implementing Phase 2 or Phase 3 features.

## Milestone 2 Status

Milestone 2 access flow is functionally implemented.

Completed:

- Buyer registration
- Seller registration / producer postulation
- Login
- Logout
- Token-based authenticated API calls
- Authentication persistence after page refresh
- Buyer, seller, and admin roles
- Backend role middleware protection
- Frontend protected areas by role
- Role-based dashboard entry
- Seller profile creation during seller registration
- New seller profile starts as `pending`
- Pending seller cannot publish active products
- Admin can approve or reject seller profiles
- Email verification placeholder
- Password reset placeholder
- Frontend auth error handling improvements
- Backend auth and role tests

Email verification and password reset are intentionally prepared as placeholders for Phase 1. Full email delivery is not implemented in Milestone 2.

## QA Checklists by Milestone

- Milestone 1 and 2: `docs/qa/milestone-1-2-qa.md`
- Milestone 3 (simple checklist): `docs/qa/milestone-3-checklist.md`
- Milestone 4 (simple checklist): `docs/qa/milestone-4-checklist.md`
- Milestone 3 and 4 (detailed QA notes): `docs/qa/milestone-3-4-qa.md`
- Full Phase 1 tracker: `docs/phase-1-milestones.md`

## Out of Scope for Milestone 1 and 2

The following are not part of this milestone closure:

- Reviews and ratings
- Notifications
- Support system
- Advanced search
- Community features
- Followers
- Posts
- Comments
- Reactions
- Mercado Pago integration
- Wallet system
- Full payment processing

These remain assigned to later phases or future extensions as documented.
