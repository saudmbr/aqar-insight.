# Aqar Insight — عقار إنسايت

## Overview

Saudi real estate **marketplace platform** — full-stack with Arabic RTL interface, analytics dashboards, live property listings, service providers marketplace, customer requests, favorites, user dashboard, real estate marketer profiles directory, and admin user management.

## Authentication & Users

- Session-based auth via `express-session` (httpOnly cookie `aqar.sid`)
- **Session store: PostgreSQL** via `connect-pg-simple` → sessions survive server restarts. `session` table auto-pruned every 15 min.
- `app.set("trust proxy", 1)` so Express correctly handles Replit's TLS-terminating reverse proxy
- Two auth paths: hardcoded admin + DB-backed regular users
- Admin credentials: `admin` / `AqarInsight2025` — override via `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
- Hardcoded admin has `userId=null` in session; personal endpoints handle this gracefully
- Session secret: override via `SESSION_SECRET` env var
- Passwords hashed with `bcryptjs` (cost factor 12)
- Login accepts username OR email as identifier
- Roles: `admin`, `user`, `property_owner`, `broker`, `real_estate_marketer`, `real_estate_office`, `developer`, `service_provider`
- Creating a marketer profile auto-upgrades role from `user` → `real_estate_marketer`
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

### Marketplace (Live)
- `listings` — live marketplace property listings (50+ fields including all amenities, nearby places, marketing flags, video, floor plan)
- `favorites` — user favorited listings (unique constraint on user_id + listing_id)
- `service_providers` — service provider profiles (contractors, designers, etc.)
- `customer_requests` — open customer requests for services or properties
- `marketer_profiles` — real estate marketer profiles with social links, verification, specialties, served areas

### Users
- `users` — registered users with role column

## Structure

```text
artifacts/
├── api-server/src/routes/
│   ├── health.ts
│   ├── auth.ts              # login, signup, logout, me
│   ├── properties.ts        # analytics CRUD + CSV
│   ├── analytics.ts         # KPIs, trends
│   ├── districts.ts         # district comparison
│   ├── listings.ts          # CRUD + search + my/similar/meta (50+ fields)
│   ├── favorites.ts         # toggle + status + list
│   ├── service-providers.ts # CRUD + my/meta
│   ├── customer-requests.ts # CRUD + my
│   ├── admin-users.ts       # list + role-update + delete (admin only)
│   └── marketers.ts         # marketer profiles CRUD + directory + verify (admin)
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
    ├── listing-detail.tsx   # Single listing + gallery + marketer card + nearby chips
    ├── listing-form.tsx     # Create/edit listing (50+ fields, nearby places, marketing flags)
    ├── marketers.tsx        # Browse all marketer profiles (directory)
    ├── marketer-profile.tsx # Public marketer profile + listings grid/list
    ├── marketer-dashboard.tsx # Marketer's own profile CRUD + listings management
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

1. **السوق**: العقارات (/listings), المسوّقون (/marketers), سوق الخدمات (/services), الطلبات (/requests)
2. **التحليلات**: لوحة التحكم (/), تحليل السوق, مقارنة الأحياء, سجل البيانات, الوحدات المستقبلية
3. **حسابي** (authenticated): لوحتي (/dashboard), ملف المسوّق (/marketer/dashboard if marketer role), الملف الشخصي (/account)
4. **الإدارة** (admin only): لوحة الإدارة, إضافة سجل, المستخدمون (/admin/users)

## Key API Endpoints

```
POST /api/auth/login|signup|logout   GET  /api/auth/me
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
GET  /api/marketers                  GET  /api/marketers/:id
GET  /api/marketers/:id/listings     GET  /api/marketers/me/profile
PUT  /api/marketers/me/profile       PUT  /api/marketers/:id/verify (admin)
DELETE /api/marketers/:id (admin)
```

## Image Upload System

- **Component**: `artifacts/aqar-monitor/src/components/image-uploader.tsx`
- **Backend**: `artifacts/api-server/src/routes/storage.ts` (GCS presigned URLs)
- **Storage**: Google Cloud Storage (Replit App Storage) via presigned URL flow
- **Upload flow**: POST `/api/storage/uploads/request-url` → PUT presigned GCS URL → store objectPath
- **Serving**: `GET /api/storage/objects/<path>` for uploaded files; direct URL for external links
- **objectPath format**: `/objects/uploads/<uuid>` — prepend `/api/storage` to serve
- **Integrated into**: listing-form (max 10), service-form (max 8), marketer-dashboard (max 1)
- **Formats**: JPG/JPEG/PNG/WebP, 5MB per file limit
- **Features**: drag-and-drop, file picker, image preview grid, reorder arrows, remove button, URL fallback, Arabic error messages
- **Backward compat**: existing URL strings still display correctly (src is used as-is for http/https)
- **Images stored**: newline-separated objectPaths or URLs in DB columns (e.g., `listings.images`)

## Marketer Module Notes

- `GET /api/marketers/me/profile` and `PUT /api/marketers/me/profile` MUST be declared BEFORE `GET /api/marketers/:id` to avoid "me" being parsed as a numeric id
- Admin (userId=null) gets a null response for GET /me/profile and 403 for PUT /me/profile
- Creating a marketer profile auto-upgrades the user's role to `real_estate_marketer`
- `servedAreas` and `specialties` stored as JSON array strings in the DB
- Marketer profile is unique per user (one profile per userId)

## Listings Fields

50+ fields including: title, description, propertyType, listingType, listingPurpose, city, district, subDistrict, location, price, areaSqm, pricePerSqm, negotiable, bedrooms, bathrooms, livingRooms, kitchens, propertyAge, furnishingStatus, streetWidth, numberOfStreets, facade, floorNumber, totalFloors, buildingQuality, finishingType, availabilityDate, parking, elevator, garden, roof, pool, maidRoom, driverRoom, storageRoom, kitchen, balcony, basement, airConditioning, smartHome, securitySystem, internet, electricityMeter, waterMeter, sewage, mortgageEligibility, nearbySchools, nearbyHospitals, nearbyMosques, nearbyMalls, nearbyTransport, nearbyParks, nearbyMainRoads, deedStatus, licenseStatus, contactPhone, whatsapp, images, videoUrl, floorPlan, featured, urgent, exclusive, ownerDirect, referenceNumber, internalNotes, views

## Legal Pages

Three full Arabic professional legal pages (public, no auth required):

| Route | Page | Color |
|-------|------|-------|
| `/terms` | الشروط والأحكام (13 sections) | Navy gradient |
| `/privacy` | سياسة الخصوصية (9 sections) | Teal gradient |
| `/usage` | سياسة الاستخدام (7 sections) | Gold gradient |

- Each page: gradient hero banner, breadcrumb, numbered sections, RTL Arabic
- All pages update `document.title` and meta description via `useEffect`
- **Footer**: added to `layout.tsx` with links to all 3 legal pages + copyright
- Clickable footer on every page in the app

## Development Commands

```bash
pnpm --filter @workspace/db run push-force  # Push DB schema
pnpm --filter @workspace/scripts run seed    # Seed analytics data
pnpm run typecheck                           # TypeScript check
```
