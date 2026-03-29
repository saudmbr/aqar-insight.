# Aqar Insight — عقار إنسايت

## Overview

Aqar Insight is a full-stack Saudi real estate marketplace platform designed with a strong emphasis on a rich, localized user experience (Arabic RTL). It integrates live property listings, a marketplace for service providers, customer request management, and comprehensive user dashboards. The platform also offers advanced analytics dashboards for market insights, a directory for real estate marketers, and robust administrative user management. The vision is to become the leading digital hub for real estate transactions and intelligence in Saudi Arabia, offering unparalleled convenience and data-driven insights to buyers, sellers, and industry professionals.

## User Preferences

I prefer clear and concise communication. When making changes, prioritize functional completeness and maintain the existing design system meticulously. For any significant architectural modifications or new feature implementations, please ask for approval before proceeding. Ensure all user-facing text is in Arabic and follows the RTL layout. All CSS variables should store raw HEX values, not HSL triples. Headings (h1-h6) should inherit color from their parent container, avoiding explicit `text-foreground` unless part of a dark hero section where `text-white` is explicitly applied to the wrapper or heading itself.

## System Architecture

The application is a monorepo built with pnpm workspaces, utilizing Node.js 24 and TypeScript 5.9. The backend is an Express 5 API server, while the frontend is a React application built with Vite, Tailwind CSS, and shadcn/ui. PostgreSQL is used as the primary database, managed with Drizzle ORM. Charts are rendered using Recharts.

**Authentication & Users:**
- Session-based authentication via `express-session` with `connect-pg-simple` for persistent sessions in PostgreSQL.
- Supports four user roles: `admin` (hardcoded, no DB entry, userId=null in session), `user`, `real_estate_marketer`, `service_provider`.
- Password hashing is done with `bcryptjs` (cost factor 12).
- Secure email-based password recovery system with token-based reset (SHA-256 hash, 15-min TTL), rate limiting (3/email/15min), and old-token invalidation on new request.
- `AuthUser.id` is `number | null` (null for the hardcoded admin).

**Homepage Architecture (Marketplace First):**
The homepage (`home.tsx`) integrates a hero section with quick search, category pills for filtering, a primary listings showcase, an interactive Leaflet map displaying property locations, platform CTA cards, and secondary market insights powered by analytics.

**Data & Analytics:**
- Two main database schemas: `properties` for historical analytics and `listings` for live marketplace data.
- Extensive analytics API endpoints (`/api/analytics/listings-insights`, `/api/analytics/listings-trends`) provide KPIs, trends, and filter options derived from active listings.
- Geographic analysis includes city/district comparisons and trend charts.

**UI/UX Decisions (Ultra Premium UI):**
- **Typography:** Uses "Cairo" font (Google Fonts) with various weights.
- **Color Palette:** Features a dark navy (`#0F1C3F`), primary teal (`#0F7BA0`), app background (`#F6F7FA`), and gold accent (`#C9A84C`).
- **Dark Hero Pattern:** All page headers use a `linear-gradient` with dark navy and teal, overlaid with a radial soft glow and dot grid. Text on dark backgrounds must have sufficient contrast (minimum `text-white/75`).
- **Shadow System:** Custom CSS variables define shadow styles for cards, hovers, and primary elements.
- **Component Styling:** `Button`, `Input`, `Card`, `ListingCard`, and `KpiCard` components have standardized premium styles, including `rounded-xl` or `rounded-2xl` corners, specific background/hover effects, and consistent sizing.
- **Image Upload System:** Utilizes Google Cloud Storage via presigned URLs for secure image uploads with drag-and-drop, preview, and reordering functionalities. Supports multiple image formats and a 5MB per file limit.
- **Legal Pages:** Three professionally designed RTL Arabic legal pages (`/terms`, `/privacy`, `/usage`) with distinct gradient banners and structured content, linked from the global footer.

**4-Level Geographic Hierarchy (منطقة → محافظة → مركز → حي):**
- Full Saudi Arabia administrative geo data in `artifacts/aqar-monitor/src/lib/saudi-geo.ts`: exports `SAUDI_GEO` (full tree), `SAUDI_REGIONS_LIST` (array of 13 region names), `getMuhafazat(region)`, `getMarakiz(region, muhafaza)`, `getAhyaa(region, muhafaza, markaz)`.
- DB `listings` table has 4 geo columns: `region` (منطقة), `city` (محافظة — kept as `city` for API compatibility), `markaz` (مركز), `district` (حي).
- **Listing form** (`listing-form.tsx`): 4 cascading dropdowns; each level resets lower levels on change; حي shows dropdown if predefined ahyaa exist, otherwise free-text input.
- **Hero search** (`home.tsx`): 4-level cascading selects in the search bar; each lower level disables until parent is chosen; search navigates to `/listings?region=...&city=...&markaz=...&district=...`.
- **Listings page** (`listings.tsx`): filter panel has 4 geo selects in Row 1; URL params from hero search are read on mount and on location change (automatically opens filter panel if region/city provided).
- **Map page** (`map-page.tsx`): filter panel includes منطقة + محافظة + مركز selects before نوع العقار.
- **Listing detail** (`listing-detail.tsx`): location breadcrumb shows full chain: منطقة › محافظة › مركز › حي throughout the page.

**Geocoding & Mapping:**
- Listings table includes `latitude` and `longitude` for precise map placement.
- Deterministic geocoding for cities without specific coordinates uses a golden-angle distribution to prevent marker stacking.
- Interactive property map (`property-map.tsx`) displays individual property pins, color-coded by listing type, with clickable popups, active pin highlighting, and **marker clustering** via `leaflet.markercluster` (teal count-badge clusters).
- **LocationPicker** (`location-picker.tsx`) — embeds in the listing form. User clicks map to place pin; Nominatim reverse geocoding auto-fills city/district; "موقعي الحالي" browser geolocation button; manual coordinate entry fallback; Saudi Arabia bounds validation client-side.
- **ListingDetailMap** (`listing-detail-map.tsx`) — non-interactive single-pin map embedded in listing detail page; shows exact coordinates; "فتح في خرائط جوجل" link.
- **Backend coordinate validation** — `parseCoords()` in `listings.ts` validates `latitude`/`longitude` against Saudi Arabia bbox (lat 15.5–32.2, lng 34.5–55.8); out-of-bounds coordinates stored as `null`.
- Both POST (create) and PUT (update) listing endpoints now handle `latitude`/`longitude` fields.

**Performance & SEO:**
- All `<img>` elements across the app include `loading="lazy"` and `decoding="async"` for improved page load performance.
- `document.title` SEO is set via `useEffect` on all major pages: listings, dashboard, map, analytics, districts, admin reports, and listing detail (dynamic title from listing data, resets on unmount).
- Admin Reports page (`/admin/reports`) has 8 tabs (overview, users, listings, requests, services, market, operational, alerts) with period filter, KPI cards, charts, and tables.
- `records.tsx` uses direct `fetch()` to `/api/listings` (not legacy hooks); supports status filter and client-side CSV export.

**Analytics Indicators (corrected for logical accuracy):**
- `listings-analytics.ts` API: `saleCount` now counts all sale types (`sale + installment + auction`); `rentCount` counts all 5 rent variants; added `investCount` (investment + partnership); added `listingsWithArea`, `turnoverRate`, `areaDataRate` to kpis response.
- `byListingType` labels now use `LISTING_LABEL_MAP` covering all 10 listing types.
- `generateSmartInsights` uses aggregated counts for sale/rent/invest distribution text.
- Analytics page Section C (مؤشرات السوق): 4 illogical indicators renamed/replaced:
  - "مؤشر القيمة العادلة" → "ميل توزيع الأسعار" (avg/median skewness, not "fair value")
  - "مؤشر قوة الطلب" → "نشاط الإعلانات الأسبوعي" (listing activity, not demand — we have no buyer data)
  - "مؤشر العرض" → "معدل دوران السوق" (new30/total% — market turnover, removes duplicate)
  - "مؤشر المخاطرة" → "تشتت الأسعار" (price dispersion, not risk)
- Home page market indicators: same fixes applied; "نسبة بيع/إيجار" → 3-way breakdown (بيع/إيجار/استثماري).

**TypeScript Quality:**
- `lib/api-zod` rebuilt — `RequestUploadUrlBody`/`RequestUploadUrlResponse` now properly exported from dist.
- All `parseInt(req.params.xxx)` calls wrapped with `String()` to satisfy strict Express param typings.
- `objectStorage.ts` `signed_url` destructure cast to typed object.
- API server achieves **0 TypeScript errors** as of current session.

**Code Rules:**
- Legacy hooks (`useGetCities`, `useGetPriceTrends`, `useGetPropertyTypes`, `useGetDistrictComparison`, `useGetYearlyComparison`) are BANNED — they depend on the empty `properties` table. Use direct `fetch()` against analytics endpoints instead.
- Admin auth: session-based `req.session.isAdmin`; `AdminRoute` component in `protected-route.tsx`.
- Number formatting: western/Latin digits via `en-US` locale throughout.
- `getImageSrc(path)` helper used on all image fields for proper GCS URL resolution.

## External Dependencies

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Charting Library:** Recharts
- **Mapping Library:** Leaflet
- **Image Storage:** Google Cloud Storage (via Replit App Storage and presigned URLs)
- **Email Service:** Nodemailer (for password recovery, configured via SMTP secrets)
- **Hashing:** bcryptjs
- **Session Management:** `express-session`, `connect-pg-simple`
- **Frontend Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Font:** Google Fonts (Cairo)