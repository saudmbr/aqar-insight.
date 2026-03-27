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

## Homepage Architecture — Marketplace First

The homepage (`home.tsx`) is structured as a **real estate marketplace** with analytics as a supporting layer:

**Section order (top to bottom):**
1. **Hero** — dark premium banner with "ابحث عن عقارك المثالي", quick search bar (listing type + property type + city dropdowns + بحث button), live stats row (total listings, avg price/sqm, new this month)
2. **Category Pills** — property type quick-filter buttons (شقق، فلل، أراضي، مكاتب، تجاري، استوديو، مستودع) + "أضف إعلانك" CTA
3. **Listings Showcase (PRIMARY)** — 8 most recent listings in 4-column grid; filters by active category pill; "عرض الكل" link to /listings
4. **Interactive Map** — Leaflet map with Saudi city bubbles; click city → navigates to /listings?city=X
5. **User Welcome / Guest CTA** — conditional banner
6. **Platform CTA Cards** — "أضف عقارك", "المسوّقون العقاريون", "اطلب عقاراً"
7. **Market Insights (SECONDARY)** — KPI cards + smart insights + charts (all derived from listings data, with analytics filter toggle)
8. **Trend Chart** — dual-axis line chart (count + avgPrice over time)
9. **Geographic Analysis** — city/district comparison tables + bar chart

**Two independent filter states:**
- `quickSearch` state → hero search bar → navigates to /listings with params
- `activeCategory` state → category pills → filters listings showcase on-page
- `applied` state → analytics filter toggle → filters KPIs + charts only

**Analytics API endpoints** (all from `listings` table, active status only):
- `GET /api/analytics/listings-insights?[filters]` — KPIs, byCity, byDistrict, byPropertyType, byListingType, smartInsights
- `GET /api/analytics/listings-trends?[filters]` — monthly time series
- `GET /api/analytics/listings-filter-options` — distinct cities, districts, property types for dropdowns

**Map component**: `artifacts/aqar-monitor/src/components/listings-map.tsx`
- Uses Leaflet + react-leaflet (installed)
- Saudi city coordinate mapping for ~25 major cities
- Circle markers sized by listing count; popup on hover; click triggers city filter

**Sidebar**: "سجل البيانات" removed from public navigation (route `/records` also removed from App.tsx)

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
│   ├── analytics.ts         # KPIs, trends (legacy properties table)
│   ├── listings-analytics.ts # Listings-based: insights, trends, filter-options
│   ├── districts.ts         # district comparison
│   ├── listings.ts          # CRUD + search + my/similar/meta (50+ fields)
│   ├── favorites.ts         # toggle + status + list
│   ├── service-providers.ts # CRUD + my/meta
│   ├── customer-requests.ts # CRUD + my
│   ├── admin-users.ts       # list + role-update + delete (admin only)
│   └── marketers.ts         # marketer profiles CRUD + directory + verify (admin)
└── aqar-monitor/src/pages/
    ├── home.tsx             # Premium homepage (hero+filters+KPIs+insights+charts+map+listings)
    ├── analytics.tsx        # Market analytics
    ├── districts.tsx        # District comparison
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

## Password Recovery

Secure email-based password reset (production-ready):

- **`/forgot-password`** — email input form. Always shows generic success regardless of email existence (prevents account enumeration). In dev mode (no SMTP), logs reset link to server console only. In production, sends HTML email via SMTP.
- **`/reset-password?token=XXX`** — validates token on page load; shows password form or invalid/expired Arabic error.

Backend routes in `auth.ts`:
- `POST /api/auth/forgot-password` → finds user by email (silently), generates 32-byte random token, stores SHA-256 hash in DB, sends email via SMTP (or logs in dev). Response: `{ success: true }` — **never** includes `resetToken`.
- `GET /api/auth/validate-reset-token?token=XXX` → checks hash exists, not used, not expired.
- `POST /api/auth/reset-password` → validates token, updates bcrypt hash, marks `used_at`.

Email service: `artifacts/api-server/src/lib/email.ts` (nodemailer)
- SMTP configured via secrets: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- App URL for reset links: `APP_URL` secret or `REPLIT_DOMAINS` env var (auto-detected)
- Dev fallback: logs link to server console if SMTP not configured
- Production guard: throws error in production if SMTP_HOST missing

Security features:
- Token stored as SHA-256 hash; raw token only exists in-process briefly
- Token TTL: **15 minutes**, one-time use (`used_at` timestamp)
- In-memory rate limiter: max 3 requests per email per 15-min window
- Never reveals whether an account exists (always `{ success: true }`)
- Password rules: ≥8 chars, must contain letters AND numbers (enforced both client and server)

DB table: `password_reset_tokens` — `id, user_id (FK→users), token_hash, expires_at, used_at, created_at`

Login page has "نسيت كلمة المرور؟" link next to the password label.

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

## Design System (Ultra Premium UI)

### Typography
- **Font**: Cairo (Google Fonts), weights 300–900. Loaded via `@import` in `index.css`
- `--font-sans: 'Cairo', sans-serif` applied globally on `html`/`body`
- **CRITICAL heading rule**: Global `h1–h6` must NOT have `text-foreground` — headings inherit color from parent container. Hero/dark sections set `text-white` on the wrapper; individual `h1` in heroes also carry explicit `text-white`.

### Color Palette
- Sidebar bg: `#0F1C3F` (dark navy)
- Primary teal: `#0F7BA0`
- App background: `#F6F7FA`
- Gold accent: `#C9A84C`
- **CRITICAL CSS variable rule**: CSS vars store raw HEX (`#0F7BA0`), NOT HSL triples. Always `var(--primary)`, never `hsl(var(--primary))`.

### Dark Hero Pattern (all page headers)
```
background: linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 60%, #0F7BA0 100%)
```
With radial soft glow overlay and dot grid: `radial-gradient(circle, #ffffff 1px, transparent 1px)` at `28px 28px`, opacity 0.04. White text enforced via container class or explicit `text-white`.

### Shadow System
CSS vars in `:root`: `--shadow-card`, `--shadow-card-hover`, `--shadow-primary`, `--shadow-dropdown`. Tailwind utility `shadow-card` maps to `--shadow-card`. ListingCard and KpiCard use inline styles for custom hover transitions.

### Component Defaults (as upgraded)
| Component | Key styles |
|-----------|-----------|
| `Button` (default/primary) | `rounded-xl h-10`, teal bg, `shadow-sm shadow-primary/25`, hover bg/90 + shadow-md, `active:scale-[0.98]` |
| `Button` (outline) | `rounded-xl`, border + bg-background, hover:bg-muted |
| `Input` | `h-11 rounded-xl`, focus ring-2 ring-primary/30 + border-primary, hover:border-primary/40 |
| `Card` | `rounded-2xl border shadow-card` |
| `ListingCard` | `rounded-[22px]`, premium hover shadow via inline style onMouseEnter/Leave, Building2 SVG placeholder |
| `KpiCard` | Gold "رئيسي" badge for primary card, trend icons, arabic numerals |

### Contrast Rules
- Dark/navy backgrounds → minimum `text-white/75`; explicit labels use `text-white`
- Light backgrounds → `text-foreground` or `text-muted-foreground`
- Never use opacity below `/75` for text on dark backgrounds

## Development Commands

```bash
pnpm --filter @workspace/db run push-force  # Push DB schema
pnpm --filter @workspace/scripts run seed    # Seed analytics data
pnpm run typecheck                           # TypeScript check
```
