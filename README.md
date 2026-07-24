<p align="center">
  <img src="public/icon-512.png" width="120" alt="The Srivari Logo" />
</p>

<h1 align="center">The Srivari</h1>
<h3 align="center">Royalty Woven — Premium Handwoven Silk Sarees</h3>

<p align="center">
  <a href="https://thesrivari.com">Live Site</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## Overview

**The Srivari** is a full-stack, production-grade luxury e-commerce platform for premium handwoven silk sarees. Built with **Next.js 16** (App Router), it features AI-powered product discovery, real-time shipping calculations, Razorpay payment integration, WhatsApp-based concierge checkout, and a stunning interactive 3D particle background inspired by [antigravity.google](https://antigravity.google).

### Key Highlights

| Feature | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 5 |
| Authentication | Supabase Auth (OTP-based) |
| Payments | Razorpay |
| Shipping | Shiprocket API |
| AI Chat | Google Gemini (`@ai-sdk/google`) |
| Email | Nodemailer |
| Image Hosting | Cloudinary |
| Styling | TailwindCSS 3 + Framer Motion |
| Testing | Vitest + Playwright |
| PWA | Service Worker + Web App Manifest |

---

## The Srivari Platform Custom Features

A catalog of the bespoke engineering implemented to ensure elite performance, a luxurious customer journey, and powerful administrative control.

### 1. The Luxury Customer Experience

*   **"The Atelier" Reservation System:** A dedicated, dark-mode portal (`/atelier`) for reserving exclusive, high-value handloom masterpieces. Integrated directly via WhatsApp to a senior stylist.
*   **The Royal Stylist (Floating AI Concierge):** A custom-built floating chat interface simulating a white-glove stylist that parses user intent and recommends products directly in the chat UI.
*   **Provenance Storytelling ("Journey of the Saree"):** An editorial section injected into product pages highlighting "The Loom", "The Zari", and "The Time" to elevate perceived value.
*   **Virtual Try-On:** AI-powered visualizer allowing users to see themselves draped in the sarees.
*   **World-Class Shop Filters:** Slide-out filter drawers, sticky command bars, view toggles (grid/list), and glassmorphism "Quick View" modals.

### 2. Elite Performance Architecture

*   **React Suspense & Streaming SSR:** `loading.tsx` shell skeleton UI pages permit the main container to load instantly from the CDN edge while complex database queries resolve in the background.
*   **Smart Edge Prefetching:** Configured `<Link prefetch={true}>` on product cards to proactively download JSON data when scrolled into the viewport. Navigation is instant.
*   **Blur-Up High-Res Images:** Next.js `placeholder="blur"` coupled with a brand-aligned base64-encoded SVG `blurDataURL` eliminates Cumulative Layout Shift (CLS).
*   **SEO Mastery:** Comprehensive JSON-LD structured data, dynamic sitemap generation fetching all DB products, and hardcoded Google Site Verification.

### 3. The Command Center (Admin Dashboard)

A multi-page admin console at `/admin` (sidebar navigation, dark/light themes), protected by **server-side Supabase auth** on every API route:

*   **Dashboard** — revenue trend, needs-attention panel, recent orders.
*   **Products** — full inventory workspace: add/edit form with zero-token description templates, AI enhancement, Cloudinary uploads and an AI Image Studio; filters, bulk actions, inline stock steppers, stock history timeline, CSV import/export.
*   **Orders** — status tabs, search, fulfilment editor (tracking number/URL/ETA), WhatsApp deep-links, manual order entry, automatic restock on cancellation.
*   **Customers** — derived CRM: lifetime value, repeat/VIP badges, per-customer order jump links.
*   **Analytics** — 7/30/90-day revenue, AOV, estimated gross profit, funnel, top sellers/customers, inventory health.
*   **Coupons** — percent/flat discount codes with min-order, caps, usage limits and expiry (validated server-side at checkout).
*   **Reviews** — moderation queue; only approved reviews appear on product pages.
*   **Suppliers** — vendor directory linked to products.
*   **Dynamic Command Palette (Cmd+K)** — jump to any page, order, or product.

### 4. Customer Features

*   **Product reviews & ratings** with JSON-LD `aggregateRating` for rich search results.
*   **Wishlist page** (`/wishlist`) with stale-data refresh, plus related-products and recently-viewed rails on product pages.
*   **Coupons at checkout** with server-side validation and totals recomputed from the database (client prices are never trusted).
*   **Order tracking** (`/order-tracking`) via Order ID + phone — no OTP delivery dependency.
*   **Newsletter signups** stored in the database (homepage band + footer).

---

## Architecture

```
srivari/
├── prisma/                     # Database schema & migrations
│   └── schema.prisma           # Product & Order models (PostgreSQL)
│
├── public/                     # Static assets
│   ├── audio/                  # Temple bell sound effects
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker for offline caching
│   ├── tirumala-temple.png     # Heritage backdrop
│   └── ...                     # Icons, images, videos
│
├── src/
│   ├── app/                    # Next.js App Router (Pages & API)
│   │   ├── layout.tsx          # Root layout: fonts, metadata, JSON-LD SEO, providers
│   │   ├── page.tsx            # Homepage: Hero + AntiGravity Gallery
│   │   ├── globals.css         # Global styles & design tokens
│   │   ├── sitemap.ts          # Dynamic XML sitemap generator
│   │   ├── robots.ts           # robots.txt generator
│   │   │
│   │   ├── about/              # Heritage page (Tirumala temple backdrop)
│   │   ├── admin/              # Multi-page admin console (dashboard, products,
│   │   │                       #   orders, customers, analytics, coupons, reviews, suppliers)
│   │   ├── auth/               # Auth callback handler
│   │   ├── cart/               # Shopping cart + checkout flow
│   │   ├── collections/        # Saree collection browser
│   │   ├── contact/            # Contact form
│   │   ├── login/              # OTP-based login
│   │   ├── order-tracking/     # Order tracking (order ID + phone)
│   │   ├── orders/             # Redirects to /account
│   │   ├── wishlist/           # Saved pieces
│   │   ├── product/            # Individual product detail page
│   │   ├── returns/            # Return policy
│   │   ├── shipping-policy/    # Shipping policy
│   │   ├── shop/               # Full shop with filters
│   │   ├── try-on/             # Virtual try-on (AI-powered)
│   │   │
│   │   └── api/                # Backend API Routes
│   │       ├── admin/          # Admin CRUD (products, orders, uploads)
│   │       ├── chat/           # AI chatbot (Gemini)
│   │       ├── delivery-updates/ # Shipping status webhooks
│   │       ├── orders/         # Order creation, tracking & admin ledger
│   │       ├── coupons/        # Coupon validation
│   │       ├── reviews/        # Product reviews
│   │       ├── newsletter/     # Newsletter signups
│   │       ├── payment/        # Razorpay payment verification
│   │       ├── products/       # Public product listing
│   │       ├── shiprocket/     # Shipping serviceability check
│   │       ├── test/           # Health check endpoint
│   │       └── virtual-try-on/ # AI saree try-on API
│   │
│   ├── components/             # Reusable UI Components
│   │   ├── ParticleBackground  # 3D interactive particle sphere (Canvas API)
│   │   ├── Hero                # Landing hero with video background
│   │   ├── HeroSlider          # Auto-rotating featured product slider
│   │   ├── AntiGravityGallery  # Animated product gallery
│   │   ├── Navbar              # Responsive navigation with search
│   │   ├── GlassSearch         # Glassmorphism search overlay
│   │   ├── ProductCard         # Product display card
│   │   ├── Footer              # Site footer
│   │   ├── InstallPrompt       # PWA install banner
│   │   ├── SocialFloating      # Floating WhatsApp button
│   │   ├── UserButton          # Auth-aware user menu
│   │   ├── Testimonials        # Customer reviews carousel
│   │   ├── Breadcrumbs         # Navigation breadcrumbs
│   │   └── SrivariImage        # Optimized Next.js Image wrapper
│   │
│   ├── context/                # React Context Providers
│   │   ├── AudioContext        # Temple bell sound (Add to Cart / Order)
│   │   ├── CartContext          # Shopping cart state (localStorage-backed)
│   │   └── WishlistContext     # Wishlist state
│   │
│   ├── lib/                    # Core Business Logic
│   │   ├── db.ts               # Database operations (CRUD for Products & Orders)
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── coupons.ts          # Coupon validation & redemption
│   │   ├── adminAuth.ts        # Server-side admin authorization
│   │   ├── shiprocket.ts       # Shiprocket API integration
│   │   ├── emailProvider.ts    # Nodemailer email service
│   │   ├── smsProvider.ts      # SMS notification service
│   │   ├── supabaseClient.ts   # Supabase client instance
│   │   └── utils.ts            # Shared utility functions
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # Product, Order, CartItem types
│   │
│   └── utils/
│       └── supabase/           # Supabase SSR helpers
│           ├── server.ts       # Server-side Supabase client
│           └── client.ts       # Client-side Supabase client
│
├── tailwind.config.ts          # TailwindCSS configuration
├── package.json
└── tsconfig.json
```

---

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Next.js     │────▶│  PostgreSQL      │
│   (React 19) │     │  App Router  │     │  (Supabase)      │
│              │◀────│  API Routes  │◀────│  via Prisma ORM  │
└──────┬───────┘     └──────┬───────┘     └──────────────────┘
       │                    │
       │  ┌─────────────────┼─────────────────┐
       │  │                 │                 │
       ▼  ▼                 ▼                 ▼
  ┌─────────┐       ┌──────────┐      ┌────────────┐
  │Razorpay │       │Shiprocket│      │Google      │
  │Payments │       │Shipping  │      │Gemini AI   │
  └─────────┘       └──────────┘      └────────────┘
```

---

## Database Schema

The application uses **Prisma ORM** with **PostgreSQL** (hosted on Supabase). Two core models:

### Product
| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Product name |
| `price` | Float | Price in INR |
| `description` | String | Rich text description |
| `category` | String | e.g., "Kanjivaram", "Banarasi" |
| `stock` | Int | Available quantity |
| `images` | String[] | Array of Cloudinary URLs |
| `video` | String? | Optional product video URL |
| `isFeatured` | Boolean | Show in hero/featured sections |
| `priceCps` | Float? | Cost price (admin only) |
| `shipping` | Float? | Product-specific shipping cost |

### Order
| Field | Type | Description |
|---|---|---|
| `id` | String | Order ID (e.g., `SRV-XXXX`) |
| `razorpay_order_id` | String? | Razorpay reference |
| `customer` | JSON | `{ name, phone, email, address }` |
| `items` | JSON | Array of `{ productId, name, price, quantity }` |
| `amount` | Float | Subtotal |
| `shipping_cost` | Float | Calculated shipping |
| `total` | Float | Grand total |
| `status` | String | `Pending` → `Shipped` → `Delivered` |
| `payment_method` | String | `Razorpay` or `WhatsApp` |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.9.0
- **PostgreSQL** database (or a [Supabase](https://supabase.com) project)
- **Razorpay** account for payments
- **Shiprocket** account for shipping
- **Google AI** API key for Gemini

### 1. Clone & Install

```bash
git clone https://github.com/pavansky/srivari.git
cd srivari
npm install
```

### 2. Environment Variables

Create a `.env` file at the project root:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY"

# Razorpay
RAZORPAY_KEY_ID="rzp_live_XXXX"
RAZORPAY_KEY_SECRET="YOUR_SECRET"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_XXXX"

# Shiprocket
SHIPROCKET_EMAIL="your@email.com"
SHIPROCKET_PASSWORD="your_password"

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY="YOUR_KEY"

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME="your_cloud"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"

# Email (Nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your@gmail.com"
EMAIL_PASS="your_app_password"

# Access control
ADMIN_EMAILS="support@thesrivari.com"          # comma-separated admin logins
SHIPROCKET_WEBHOOK_SECRET="a-long-random-token" # must match the x-api-key configured in Shiprocket

# Local development only — bypasses admin auth. NEVER set in production.
# ADMIN_DEV_BYPASS="1"
# NEXT_PUBLIC_ADMIN_DEV_BYPASS="1"
```

> **Never commit env files.** `.gitignore` excludes `.env*`; production values live in Vercel project settings.

### 3. Database Setup

```bash
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema to database
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## API Reference

All API routes are under `/api/`. They accept and return JSON.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | List products (cost/supplier fields stripped; `?archived=true` requires admin) |
| `POST/PUT` | `/api/products` | **Admin** | Create / update a product |
| `DELETE/PATCH` | `/api/products` | **Admin** | Archive / restore a product |
| `POST` | `/api/products/import` | **Admin** | Bulk CSV import |
| `GET` | `/api/products/history` | **Admin** | Inventory transaction log |
| `POST` | `/api/orders/create` | Public (rate-limited) | Place an order — prices re-derived server-side |
| `GET/PUT` | `/api/orders` | **Admin** | Order ledger / status & tracking updates |
| `POST` | `/api/orders/track` | Public (rate-limited) | Track an order by ID + phone |
| `POST` | `/api/payment/verify` | Signature | Verify Razorpay payment (stock reserved here) |
| `POST` | `/api/coupons/validate` | Public (rate-limited) | Validate a coupon against the subtotal |
| `GET/POST/DELETE` | `/api/admin/coupons` | **Admin** | Coupon CRUD |
| `GET/POST` | `/api/reviews` | Public (rate-limited) | Approved reviews / submit for moderation |
| `GET/PATCH/DELETE` | `/api/admin/reviews` | **Admin** | Review moderation |
| `POST` | `/api/newsletter` | Public (rate-limited) | Newsletter signup |
| `GET/POST/DELETE` | `/api/admin/suppliers` | **Admin** | Supplier CRUD |
| `POST` | `/api/admin/ai-*` | **Admin** | Gemini description/image studio helpers |
| `POST` | `/api/chat`, `/api/stylist` | Public (rate-limited) | AI copywriter / Royal Stylist |
| `POST` | `/api/virtual-try-on` | Public (rate-limited) | AI saree try-on (Vertex AI) |
| `POST` | `/api/delivery-updates` | Webhook secret | Shiprocket status webhook |
| `GET/POST/DELETE` | `/api/user/*` | Bearer token | Current user's orders, addresses, sync |

**Admin auth** = a valid Supabase session whose email is in the `ADMIN_EMAILS` env var (comma-separated; defaults to the store owner). Enforced server-side in `src/lib/adminAuth.ts` — the client-side gate on `/admin` is UX only.

---

## SEO Strategy

The application implements a multi-layered SEO approach:

1. **Rich Metadata** — Expansive keywords targeting "sarees", "silk sarees", "kanjivaram", "bridal sarees", etc.
2. **OpenGraph & Twitter Cards** — Optimized social sharing previews
3. **JSON-LD Structured Data** — `Organization` + `Store` schema telling Google exactly what the business is
4. **Dynamic Sitemap** (`/sitemap.xml`) — Auto-generated from Next.js route conventions
5. **Robots.txt** (`/robots.txt`) — Explicitly allows crawling and points to sitemap
6. **AI SEO Service** (`src/lib/seo-ai.ts`) — Architecture for AI-driven keyword and description generation per product

---

## Progressive Web App (PWA)

The Srivari is installable as a native-like app on mobile and desktop:

- **Service Worker** (`public/sw.js`) — Caches static assets for offline access
- **Web App Manifest** (`public/manifest.json`) — App name, icons, theme colors
- **Install Prompt** — Custom in-app banner prompting users to install

---

## Interactive Particle Background

The centerpiece visual effect is a **3D interactive particle sphere** (`src/components/ParticleBackground.tsx`) built with the Canvas API:

- **Fibonacci Sphere Distribution** — Particles are evenly distributed in 3D space
- **Continuous 3D Rotation** — The sphere slowly rotates on multiple axes
- **Cursor/Touch Tracking** — The sphere's center smoothly follows user input with easing
- **Depth Perception** — Particles scale and fade based on their Z-depth
- **Inspired by** [antigravity.google](https://antigravity.google)

---

## Audio Experience

A **Tirumala Temple bell** chimes on key user interactions:

- **Add to Cart** — A single resonant bell ring confirms the action
- **Order Placed** — The bell rings to mark a successful purchase

Implemented via `src/context/AudioContext.tsx` which pre-loads the audio and exposes a `playBell()` hook.

---

## Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npx playwright test
```

---

## Deployment

The app is deployed on **Vercel** with automatic deployments from the `main` branch.

```bash
# Production build
npm run build

# Verify locally
npm start
```

---

## Tech Stack Visual

```
Frontend                    Backend                     External Services
─────────                   ───────                     ─────────────────
React 19                    Next.js API Routes          Supabase (Auth + DB)
TailwindCSS 3               Prisma ORM                  Razorpay (Payments)
Framer Motion               PostgreSQL                  Shiprocket (Shipping)
Canvas API (Particles)      Nodemailer                  Google Gemini (AI)
Lucide Icons                                            Cloudinary (Images)
```

---

## License

Private — All rights reserved by **The Srivari**.

---

<p align="center">
  <i>Weaving legacy into every thread 🧵</i>
</p>
