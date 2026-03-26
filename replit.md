# Aqar Insight — عقار إنسايت

## Overview

Saudi real estate **marketplace platform** — full-stack with Arabic RTL interface, analytics dashboards, live property listings, service providers marketplace, customer requests, favorites, user dashboard, and admin user management.

## Authentication & Users

- Session-based auth via `express-session` (httpOnly cookie `aqar.sid`)
- **Session store: PostgreSQL** via `connect-pg-simple` → sessions survive server restarts and are shared across all worker processes. `session` table auto-pruned every 15 min.
- `app.set("trust proxy", 1)` so Express correctly handles Replit's TLS-terminating reverse proxy
- Two auth paths: hardcoded admin + DB-backed regular users
- Admin credentials: `admin` / `AqarInsight2025` — override via `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
- Hardcoded admin has `userId=null` in session; personal endpoints handle this gracefully (return [] or filter by NULL userId)
- Session secret: override via `SESSION_SECRET` env var
- Passwords hashed with `bcryptjs` (cost factor 12)
- Login accepts username OR email as identifier
- Roles: `admin`, `user`, `property_owner`, `broker`, `real_estate_office`, `developer`, `service_provider`
- `UserRoute` guard: redirects unauthenticated users to `/login`
- `AdminRoute` guard: redirects non-admins to 403 page

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js**: 24, **TypeScript**: 5.9
- **API framework**: Express 5 (`artifacts/api-server`)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (`artifacts/aqar-monitor`)
- **Database**: PostgreSQL + Drizzle ORM
- **Charts**: Recharts

## Database Tables

### Legacy (Analytics)
- `properties` — historical real estate analytics data (3,300 seeded records)

### Marketplace (New)
- `listings` — live marketplace property listings (status: active/sold/rented/cancelled)
- `favorites` — user favorited listings (unique constraint on user_id + listing_id)
- `service_providers` — service provider profiles (contractors, designers, etc.)
- `customer_requests` — open customer requests for services or properties

### Users
- `users` — registered users with role column

## Structure

```text
artifacts/
├── api-server/src/routes/
│   ├── health.ts
│   ├── auth.ts             # login, signup, logout, me
│   ├── properties.ts       # analytics CRUD + CSV
│   ├── analytics.ts        # KPIs, trends
│   ├── districts.ts        # district comparison
│   ├── listings.ts         # CRUD + search + my/similar/meta
│   ├── favorites.ts        # toggle + status + list
│   ├── service-providers.ts # CRUD + my/meta
│   ├── customer-requests.ts # CRUD + my
│   └── admin-users.ts      # list + role-update + delete (admin only)
└── aqar-monitor/src/pages/
    ├── home.tsx             # Analytics dashboard
    ├── analytics.tsx        # Market analytics
    ├── districts.tsx        # District comparison
    ├── records.tsx          # Data table
    ├── future.tsx           # Future modules
    ├── login.tsx            # Login
    ├── signup.tsx           # Signup
    ├── account.tsx          # Profile + password change
    ├── listings.tsx         # Browse/search listings
    ├── listing-detail.tsx   # Single listing detail + favorites
    ├── listing-form.tsx     # Create/edit listing
    ├── dashboard.tsx        # User dashboard (listings, favorites, requests tabs)
    ├── services.tsx         # Service providers marketplace
    ├── service-form.tsx     # Create service provider
    ├── requests.tsx         # Customer requests
    ├── request-form.tsx     # Post a request
    ├── admin-panel.tsx      # Admin panel (analytics data)
    ├── admin-add.tsx        # Add analytics record
    ├── admin-edit.tsx       # Edit analytics record
    └── admin-users.tsx      # Admin user management
```

## Sidebar Navigation

1. **السوق**: العقارات (/listings), سوق الخدمات (/services), الطلبات (/requests)
2. **التحليلات**: لوحة التحكم (/), تحليل السوق, مقارنة الأحياء, سجل البيانات, الوحدات المستقبلية
3. **حسابي** (authenticated): لوحتي (/dashboard), حسابي (/account)
4. **الإدارة** (admin only): لوحة الإدارة, إضافة سجل, المستخدمون (/admin/users)

## Key API Endpoints

```
POST /api/auth/login|signup|logout   GET /api/auth/me
GET  /api/listings                   POST /api/listings
GET  /api/listings/my/listings       GET  /api/listings/meta/options
GET  /api/listings/:id               PUT  /api/listings/:id
DELETE /api/listings/:id             GET  /api/listings/:id/similar
GET  /api/favorites                  POST /api/favorites/:id/toggle
GET  /api/favorites/:id/status
GET  /api/service-providers          POST /api/service-providers
GET  /api/service-providers/my/profile
GET  /api/service-providers/meta/categories
GET  /api/customer-requests          POST /api/customer-requests
GET  /api/customer-requests/my/requests
DELETE /api/customer-requests/:id
GET  /api/admin/users                PUT  /api/admin/users/:id/role
DELETE /api/admin/users/:id
```

## Development Commands

```bash
pnpm --filter @workspace/db run push-force  # Push DB schema
pnpm --filter @workspace/scripts run seed    # Seed analytics data
pnpm run typecheck                           # TypeScript check
```
