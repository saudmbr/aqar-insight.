# Aqar Insight — عقار إنسايت

## Overview

Saudi real estate intelligence platform — a full-stack analytics MVP with Arabic RTL interface, market data dashboards, and price monitoring.

## Authentication & Users

- Session-based auth via `express-session` (httpOnly cookie `aqar.sid`)
- Two auth paths: hardcoded admin + DB-backed regular users
- Admin credentials: `admin` / `AqarInsight2025` — override via `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
- Session secret: override via `SESSION_SECRET` env var
- Users table: `id, full_name, username, email, password_hash, role, created_at`
- Passwords hashed with `bcryptjs` (cost factor 12)
- Login accepts username OR email as identifier
- Roles: `admin` (full access) / `user` (public pages only)
- Public routes: `/`, `/analytics`, `/districts`, `/records`, `/future` — no auth required
- Admin-only routes: `/admin`, `/admin/add`, `/admin/edit/*` → `AdminRoute` guard
- Non-admin authenticated user hitting admin routes → redirected to `/`
- Unauthenticated user hitting admin routes → redirected to `/login`
- Signup at `/signup` → auto-login → redirect to `/`
- Admin login → redirect to `/admin`
- Regular user login → redirect to `/`
- Backend auth routes: `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `GET /api/auth/me`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (`artifacts/api-server`)
- **Frontend**: React + Vite + Tailwind CSS (`artifacts/aqar-monitor`)
- **Database**: PostgreSQL + Drizzle ORM
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **API codegen**: Orval (from OpenAPI spec)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (API), Vite (frontend)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port from $PORT)
│   │   └── src/routes/
│   │       ├── health.ts
│   │       ├── properties.ts   # CRUD + CSV export
│   │       ├── analytics.ts    # KPIs, trends, yearly comparison
│   │       └── districts.ts    # District comparison, cities, types
│   └── aqar-monitor/       # React + Vite frontend (RTL Arabic)
│       └── src/pages/
│           ├── home.tsx           # Dashboard — KPI cards + charts
│           ├── analytics.tsx      # Market analytics + filters
│           ├── districts.tsx      # District comparison chart
│           ├── records.tsx        # Data table + search + CSV export
│           ├── admin-add.tsx      # Add property record form
│           └── future.tsx         # Upcoming AI modules showcase
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/
│       └── src/schema/
│           └── properties.ts   # Drizzle properties table
├── scripts/
│   └── src/seed.ts         # Seed 3,300 Saudi property records
└── ...
```

## Pages (6)

1. **/** — لوحة التحكم (Home Dashboard): KPI cards, price trends, property type chart
2. **/analytics** — تحليل السوق (Market Analytics): Line/bar charts, filters, yearly comparison
3. **/districts** — مقارنة الأحياء (District Comparison): Horizontal bar chart by district
4. **/records** — سجل البيانات (Data Records): Table, search, filters, CSV export
5. **/admin/add** — إضافة سجل (Add Record): Property form with validation
6. **/future** — الوحدات المستقبلية (Future Modules): Coming-soon AI features

## API Endpoints

- `GET /api/healthz`
- `GET /api/properties` — list with filters + pagination
- `POST /api/properties` — add record
- `GET /api/properties/export` — CSV download
- `GET /api/analytics/kpis` — KPI metrics
- `GET /api/analytics/price-trends` — monthly trend data
- `GET /api/analytics/property-types` — type breakdown
- `GET /api/analytics/yearly-comparison` — year-over-year
- `GET /api/districts/comparison?city=` — district stats
- `GET /api/districts/cities` — city list
- `GET /api/districts/types` — property type list

## Sample Data

3,300 property records seeded across:
- **5 cities**: الرياض، جدة، الدمام، مكة المكرمة، المدينة المنورة
- **6 property types**: شقة، فيلا، أرض، مكتب، محل تجاري، دوبلكس
- **2 listing types**: بيع (sale) / إيجار (rent)
- **5 years**: 2021–2025 with realistic price trends

## Future Modules (planned)

- تنبيهات ذكية — Smart price alerts
- تقدير القيمة العادلة — AI fair value estimation
- المساعد الذكي — AI chat assistant
- خريطة حرارية — Geographic heatmap
- نقاط الاستثمار — Investment scoring

## Development Commands

```bash
# Run codegen (after OpenAPI spec changes)
pnpm --filter @workspace/api-spec run codegen

# Push DB schema
pnpm --filter @workspace/db run push

# Seed data
pnpm --filter @workspace/scripts run seed

# Type check
pnpm run typecheck
```
