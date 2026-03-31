# Aqar Insight — عقار إنسايت

## Overview

Aqar Insight is a full-stack Saudi real estate marketplace platform with a strong emphasis on a rich, localized Arabic RTL user experience. It integrates live property listings, a marketplace for service providers, customer request management, and comprehensive user dashboards. The platform also offers advanced analytics dashboards for market insights, a directory for real estate marketers, and robust administrative user management. The vision is to become the leading digital hub for real estate transactions and intelligence in Saudi Arabia, offering unparalleled convenience and data-driven insights to buyers, sellers, and industry professionals.

## User Preferences

I prefer clear and concise communication. When making changes, prioritize functional completeness and maintain the existing design system meticulously. For any significant architectural modifications or new feature implementations, please ask for approval before proceeding. Ensure all user-facing text is in Arabic and follows the RTL layout. All CSS variables should store raw HEX values, not HSL triples. Headings (h1-h6) should inherit color from their parent container, avoiding explicit `text-foreground` unless part of a dark hero section where `text-white` is explicitly applied to the wrapper or heading itself.

## System Architecture

The application is a monorepo built with pnpm workspaces, utilizing Node.js 24 and TypeScript 5.9. The backend is an Express 5 API server, while the frontend is a React application built with Vite, Tailwind CSS, and shadcn/ui. PostgreSQL is used as the primary database, managed with Drizzle ORM. Charts are rendered using Recharts. A separate Expo React Native mobile application (`artifacts/aqar-mobile`) provides a native mobile experience.

**Authentication & Users:**
- Session-based authentication via `express-session` with `connect-pg-simple`.
- Supports four user roles: `admin`, `user`, `real_estate_marketer`, `service_provider`.
- Password hashing with `bcryptjs`.
- Secure email-based password recovery system with token-based reset and rate limiting.

**Homepage Architecture (Marketplace First):**
The homepage integrates a hero section with quick search, category filters, a primary listings showcase, an interactive Leaflet map, platform CTA cards, and secondary market insights.

**Data & Analytics Engine:**
- Two database schemas: `properties` for historical analytics and `listings` for live marketplace data.
- Analytics API provides KPIs, regional breakdowns, property type analysis, smart insights, market score (0-100), and supply/demand indicators.
- A listing benchmark API compares individual listing prices against market averages.
- Frontend utilizes `src/hooks/use-analytics.ts` for centralized data fetching.
- Analytics page (`analytics.tsx`) features 7 category tabs for detailed market analysis.
- Listing detail pages include a live "تقييم السعر" (price evaluation) benchmark widget.

**UI/UX Decisions (Ultra Premium UI):**
- **Typography:** Uses "Cairo" font.
- **Color Palette:** Dark navy (`#0F1C3F`), primary teal (`#0F7BA0`), app background (`#F6F7FA`), and gold accent (`#C9A84C`).
- **Dark Hero Pattern:** All page headers use a `linear-gradient` with dark navy and teal, overlaid with a radial soft glow and dot grid.
- **Shadow System:** Custom CSS variables define shadow styles for elements.
- **Component Styling:** Standardized premium styles for `Button`, `Input`, `Card`, `ListingCard`, and `KpiCard` components with `rounded-xl` or `rounded-2xl` corners.
- **Image Upload System:** Utilizes Google Cloud Storage via presigned URLs for secure image uploads with drag-and-drop, preview, and reordering.
- **Legal Pages:** Professionally designed RTL Arabic legal pages (`/terms`, `/privacy`, `/usage`) with distinct gradient banners.

**4-Level Geographic Hierarchy (منطقة → محافظة → مركز → حي):**
- Full Saudi Arabia administrative geo data (`artifacts/aqar-monitor/src/lib/saudi-geo.ts`) is integrated across the platform.
- Database `listings` table includes `region`, `city` (محافظة), `markaz`, and `district` (حي).
- Cascading dropdowns are used in listing forms, search, and filter panels.

**Geocoding & Mapping:**
- Listings include `latitude` and `longitude`.
- Deterministic geocoding for cities prevents marker stacking on maps.
- Interactive property map (`property-map.tsx`) displays color-coded property pins with clustering (`leaflet.markercluster`).
- `LocationPicker` component allows users to place pins on a map, with Nominatim reverse geocoding and browser geolocation.
- Backend validates coordinates against Saudi Arabia bounding box.

**Performance & SEO:**
- `loading="lazy"` and `decoding="async"` attributes are used for all `<img>` elements.
- Dynamic `document.title` SEO is implemented for major pages.

**Analytics Indicators:**
- API indicators (`saleCount`, `rentCount`, `investCount`, `listingsWithArea`, `turnoverRate`, `areaDataRate`) are logically corrected.
- Analytics page section C indicators (e.g., "ميل توزيع الأسعار", "نشاط الإعلانات الأسبوعي", "معدل دوران السوق", "تشتت الأسعار") are refined for accuracy.

**Service Providers:**
- `service_providers` table extended with `cover_image TEXT` and `website_url TEXT`.
- Service provider profiles (`service-provider-profile.tsx`) and forms (`service-form.tsx`) support these new fields.
- Marketers and requests filters utilize regional and specialty data.

**User Reports / Flagging System:**
- Drizzle schema and PostgreSQL table for `user_reports` (id, reporterId, targetType, targetId, reason, status, etc.).
- API endpoints for creating, viewing (admin), and updating (admin) reports.
- `ReportDialog` component for user-facing reporting across listing, marketer, service provider, and request detail pages.
- Admin page (`/admin/user-reports`) for managing reports.

**Mobile App (Expo React Native):**
- Features a 5-tab bar navigation for Home, Listings, Discover (Analytics, Marketers, Services, Requests), Favorites, and Profile.
- Dedicated screens for listing details, authentication, marketer/service provider directories and profiles, customer requests, analytics, and legal pages.
- Local AsyncStorage is used for favorites.
- API integration notes detail expected response formats and data handling.

**Mobile App Auth (Critical Notes):**
- Login API uses field `identifier` (not `username`).
- Register API uses field `userType` (not `role`).
- Login/register responses are flat objects `{userId, username, fullName, role}` — NOT nested under `user`.
- `/api/auth/me` returns `{isAuthenticated, userId, username, fullName, role}`.
- `checkSession()` in `AuthContext` verifies session with server on startup.
- RTL approach: manual `flexDirection: 'row-reverse'` and `textAlign: 'right'` everywhere. Do NOT add `dir="rtl"` at HTML level (causes double-flip).

**Mobile App New Screens:**
- `profile-edit.tsx`: Full profile editing with `PUT /api/auth/profile`.
- `contact.tsx`: Contact channels (email, WhatsApp, Twitter) and message form with working hours display.

**Mobile App Listing Detail:**
- Share button, image counter, featured/urgent/verified badges.
- Price-per-sqm calculation, location breakdown chips, floors chip.
- Inline call/WhatsApp buttons in marketer card.
- Similar listings horizontal scroll section.
- `useEffect` redirect for auth-protected screens (never redirect during render).

## External Dependencies

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Charting Library:** Recharts
- **Mapping Library:** Leaflet
- **Image Storage:** Google Cloud Storage (via Replit App Storage and presigned URLs)
- **Email Service:** Nodemailer (SMTP configured)
- **Hashing:** bcryptjs
- **Session Management:** `express-session`, `connect-pg-simple`
- **Frontend Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Font:** Google Fonts (Cairo)