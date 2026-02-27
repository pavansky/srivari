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
│   │   ├── admin/              # Admin dashboard (product & order management)
│   │   ├── auth/               # Auth callback handler
│   │   ├── cart/               # Shopping cart + checkout flow
│   │   ├── collections/        # Saree collection browser
│   │   ├── contact/            # Contact form
│   │   ├── login/              # OTP-based login
│   │   ├── order-tracking/     # Customer order tracking
│   │   ├── orders/             # Order history
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
│   │       ├── orders/         # Order creation & retrieval
│   │       ├── otp/            # Send & verify OTP
│   │       ├── payment/        # Razorpay order creation & verification
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
│   ├── data/                   # Static seed data
│   │   └── products.ts         # Initial product catalog
│   │
│   ├── lib/                    # Core Business Logic
│   │   ├── db.ts               # Database operations (CRUD for Products & Orders)
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── orders.ts           # Order processing logic
│   │   ├── shiprocket.ts       # Shiprocket API integration
│   │   ├── emailProvider.ts    # Nodemailer email service
│   │   ├── smsProvider.ts      # SMS notification service
│   │   ├── otp.ts              # OTP generation & verification
│   │   ├── seo-ai.ts           # AI-driven SEO metadata generation
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
```

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

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List all products |
| `POST` | `/api/products` | Create a product (admin) |
| `POST` | `/api/orders/create` | Place a new order |
| `GET` | `/api/orders` | List all orders (admin) |
| `POST` | `/api/payment/create-order` | Create a Razorpay order |
| `POST` | `/api/payment/verify` | Verify Razorpay payment signature |
| `POST` | `/api/shiprocket/serviceability` | Check shipping to a pincode |
| `POST` | `/api/otp/send` | Send OTP to phone |
| `POST` | `/api/otp/verify` | Verify OTP |
| `POST` | `/api/chat` | AI chatbot (Gemini) |
| `POST` | `/api/virtual-try-on` | AI saree try-on |
| `POST` | `/api/admin/upload` | Upload images to Cloudinary |
| `GET` | `/api/test` | Health check |

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
