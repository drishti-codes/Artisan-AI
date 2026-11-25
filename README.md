# ArtisanAI — Bringing Local Crafts Worldwide

ArtisanAI is an AI-powered marketplace that connects Indian artisans with customers everywhere.
Customers can describe what they want in their own words (typed or spoken, in English, Hindi or
Hinglish) and the AI finds real handmade products that fit their budget, occasion and taste.

> Status: academic project (Project-1), work in progress. See the roadmap below for what is done
> and what is planned.

## Why this project

India's handicraft sector supports around 7 million artisans, but many depend on middlemen and
local markets. Existing platforms still expect artisans to write listings and set up accounts
themselves, which is hard for low-literacy sellers. ArtisanAI aims to make both buying and
selling easier with AI.

## Features built so far

**Customer side**
- Register / login (JWT authentication)
- Product catalog with search, category, price and region filters
- Product detail pages with artisan info, craft origin and story
- Artisan directory, artisan profiles and follow / unfollow
- Stories section (long-form pages about artisans and crafts)
- Cart with live totals (guest cart is merged on login)
- Checkout flow, order history and order tracking timeline
- Multi-language selector (English, Hindi, Marathi, Bengali, Gujarati, Tamil, Telugu)

**AI Gift & Product Discovery** (`/ai-discovery`)
- Customer types or speaks a request, e.g. *"gift for my mother under 2000 for Diwali"*
- Gemini turns the request into structured intent (budget, category, occasion, region, craft)
- The backend queries MongoDB, so only **real products** are ever recommended
- Gemini then picks the best matches and writes a short reason for each
- Voice input using the browser Web Speech API (language follows the selected language)
- Keyword-search fallback if the AI is slow, unavailable or over its daily limit, so the page never breaks

**Seller (artisan) side**
- Seller onboarding
- Product management (add, edit, delete)
- Inventory view with stock levels
- Order management and status updates
- Sales and overview dashboard, delivery view

**Payments**
- Razorpay order creation and signature verification are implemented
- Currently running in **demo (mock) mode** (`PAYMENT_MODE=mock`), no real money is charged

## How AI Discovery works

```
Customer text
   │
   ▼
[1] Gemini: text -> JSON {budget, categories, occasion, regions, crafts, keywords}
   │
   ▼
[2] MongoDB: filter real products (active, within budget, matching category)
   │
   ▼
[3] Gemini: choose the best 1-6 from those candidates + write a reason for each
   │
   ▼
[4] Frontend: product cards + chips (Under ₹2000, pottery, ...) + reason under each card
```

Why two steps: the AI never sees the whole catalog and can only choose from products returned by
the database, so it cannot invent products. If any AI step fails, the backend returns keyword-based
results in the same response format.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT, bcrypt |
| AI | Google Gemini API (REST) |
| Voice input | Browser Web Speech API |
| Payments | Razorpay (demo mode by default) |

## Architecture

The backend is currently a **modular monolith**: one Express app, with each feature in its own
folder under `backend/src/modules/` (auth, products, cart, orders, payments, seller, ai, ...).
The project synopsis proposes a microservices architecture (with RabbitMQ, Redis and Docker on
AWS ECS). The module boundaries are kept clean so services can be split out later.

```
ArtisanAI/
├── frontend/   Next.js app (pages in app/, shared UI in components/)
└── backend/    Express API
    └── src/modules/<feature>/   routes + service + model per feature
```

## Run locally

Prerequisites: Node.js 18+ and a MongoDB database (Atlas or local).

**Backend**
```bash
cd backend
npm install
cp .env.example .env     # then fill in the values
npm run seed             # loads demo artisans, categories and products
npm run dev              # http://localhost:5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev              # http://localhost:3000
```

**Environment variables** (`backend/.env`, never commit this file)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random text for login tokens |
| `CLIENT_URL` | Frontend address allowed by CORS |
| `PAYMENT_MODE` | `mock` (demo) or `razorpay` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Only for `razorpay` mode (use test keys) |
| `GEMINI_API_KEY` | Gemini API key for AI Discovery |
| `LLM_MODEL` | Gemini model ID, e.g. `gemini-3-flash-preview` |
| `AI_DAILY_LIMIT` | Max AI requests per day per server |

If `GEMINI_API_KEY` is missing or the model is unavailable, AI Discovery automatically falls back
to keyword search.

## API overview

Base URL: `http://localhost:5000/api` (see `backend/API.md` for details)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/...`, `GET /auth/me` |
| Catalog | `GET /products`, `GET /products/:id`, `GET /categories`, `GET /artisans`, `GET /stories` |
| Cart & orders | `/cart/...`, `/orders/...` |
| Payments | `POST /payments/create-order`, `/verify`, `/mock-confirm` (demo) |
| Seller | `/seller/...` (artisan and admin roles only) |
| AI | `POST /ai/discover` body: `{ "query": "..." }` |

## Roadmap

| Feature (from synopsis) | Status |
|---|---|
| Marketplace: catalog, cart, checkout, orders | Done |
| AI purchase decision engine (AI Discovery) | Done |
| Voice input for customer search | Done |
| Razorpay payments | Implemented in demo mode, real test mode and webhook pending |
| Seller dashboard (products, orders, inventory) | Done (basic) |
| Global-to-Local discovery | Planned |
| Voice-based artisan onboarding (speech -> profile) | Planned (route placeholder exists) |
| AI-assisted product listing (photo -> title/description/tags) | Planned |
| Artisan story generation | Planned |
| Multilingual translation of artisan content | Planned |
| Demand prediction and smart inventory insights | Planned |
| Order / payment notifications | Planned |
| Microservices, RabbitMQ, Redis, Docker / AWS ECS | Planned |

## Team

Drishti Jha, Priyansi Dubey, Dwarika Mehta