# Mark 1615 Shop — Technical Specification

**Version:** 1.0  
**Date:** 6 July 2026  
**Status:** Draft for implementation  
**Audience:** Developers and project stakeholders

---

## 1. Executive Summary

This document specifies how to add e-commerce to the existing Mark 1615 website (`mark1615.co.za`). The site is currently a **static HTML + Bootstrap + vanilla JavaScript** nonprofit template (ChariTeam). The goal is to:

- Add a **Shop** section with product browsing and cart
- Manage products in a **headless CMS** (editable elsewhere, not in HTML files)
- Process payments via **Paystack** (ZAR, South Africa)
- Provide **order tracking** and **invoice** pages

**Recommendation:** Do **not** migrate the entire site to React. Extend the existing stack with new shop pages, vanilla JS modules (matching patterns like `js/gallery.js` and `js/eventsData.js`), and a small **serverless backend** for Paystack secrets and order persistence. Use **Sanity** or **Payload CMS** as the product CMS.

---

## 2. Current State

| Aspect | Detail |
|--------|--------|
| Stack | Static HTML, Bootstrap 5, jQuery-era libs (WOW, Owl Carousel), vanilla JS |
| Build tooling | None (no `package.json`, no bundler) |
| Hosting | Assumed static hosting (GitHub Pages, Netlify, or similar) |
| Location / currency | Rosebank, South Africa → **ZAR** via Paystack |
| Existing patterns | `gallery.js` fetches external API data; `eventsData.js` holds local structured data |
| Navbar pages | Home, About, Events, Gallery, Prayers, Contact |

The shop should **reuse the existing layout** (navbar, footer, `css/style.css`, Bootstrap components) so it feels native to the site.

---

## 3. Goals & Non-Goals

### Goals

- Browse products by category
- Add to cart, adjust quantities, checkout
- Pay via Paystack (cards, bank, etc. supported in ZA)
- Receive order confirmation email (via backend)
- View order status by order reference / email
- Download or view invoice (PDF or printable HTML)
- Manage products, prices, images, stock flags in a CMS dashboard

### Non-Goals (v1)

- Full React/Next.js rewrite of the whole site
- Multi-vendor marketplace
- Complex shipping integrations (manual flat-rate or pickup is fine for v1)
- Native mobile apps
- Subscription / recurring billing (can be phase 2)

---

## 4. Architecture Decision: React vs Lightweight

### Options Evaluated

| Approach | Pros | Cons | Fit for Mark 1615 |
|----------|------|------|-------------------|
| **Full React / Next.js** | Rich ecosystem, SSR, many ecommerce templates | Large rewrite; rest of site stays static; two stacks | Poor — overkill |
| **React island (Vite + single shop bundle)** | Modern DX for shop only | Still adds build step; team maintains two patterns | Moderate |
| **Vanilla JS + ES modules (recommended)** | Matches existing codebase; no framework lock-in; smallest diff | More manual DOM work | **Best** |
| **Snipcart embed** | Fastest to ship | Monthly fees; limited Paystack support; less control | Poor for Paystack |
| **Medusa.js full backend** | Complete commerce engine; Paystack plugin exists | Requires Node server 24/7; heavy for a church merch shop | Moderate (if catalog grows large) |

### Decision

**Use vanilla JavaScript (ES modules) for the storefront**, consistent with `gallery.js`. Optionally add **Vite** later only for the `shop/` folder if bundling becomes necessary — not required for v1.

**Add a thin serverless API** (Netlify Functions, Cloudflare Workers, or Vercel Serverless) because:

- Paystack **secret key** must never live in browser code
- Payment **verification** must happen server-side ([Paystack docs](https://paystack.com/docs/payments/verify-payments/))
- **Webhooks** require a public POST endpoint ([Paystack webhooks](https://paystack.com/docs/payments/webhooks/))

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mark 1615 Static Site                        │
│  shop.html · product.html · cart.html · checkout.html           │
│  order.html · invoice.html                                       │
│  js/shop/*.js (cart, catalog, checkout UI)                       │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ GROQ/REST (read-only,        │ fetch (cart, checkout,
                │ public token)                │  order lookup)
                ▼                              ▼
┌───────────────────────────┐    ┌──────────────────────────────┐
│   Headless CMS            │    │   Serverless API               │
│   Sanity or Payload       │    │   /api/checkout/initialize     │
│   (products, images,      │    │   /api/checkout/verify         │
│    categories, stock)     │    │   /api/webhooks/paystack       │
│   Managed in Studio       │    │   /api/orders/:ref             │
└───────────────────────────┘    │   /api/orders/:ref/invoice     │
                                 └──────────────┬───────────────┘
                                                │
                                                ▼
                                 ┌──────────────────────────────┐
                                 │   Paystack (ZAR)             │
                                 │   Inline JS popup + webhooks │
                                 └──────────────────────────────┘
                                                │
                                                ▼
                                 ┌──────────────────────────────┐
                                 │   Order store                │
                                 │   MongoDB Atlas / Firebase /      │
                                 │   Sanity dataset / Payload   │
                                 └──────────────────────────────┘
```

---

## 5. Headless CMS Recommendation

Products should be managed in a dashboard, not hard-coded in HTML.

### Recommended: **Sanity.io** (primary pick)

| Criterion | Sanity |
|-----------|--------|
| Product modeling | Flexible schemas (title, slug, price, images, variants, categories) |
| API | GROQ + CDN; read-only token safe for browser |
| Hosting | Sanity hosts Studio; no server to maintain |
| Free tier | Generous for small catalogs |
| SA / ZAR | Currency stored as number; display as ZAR on frontend |
| Fit with static HTML | `@sanity/client` works from vanilla JS |

**Alternative: Payload CMS 3.x**

- Self-hosted or Payload Cloud
- Built-in admin UI, PostgreSQL/MongoDB
- [`paystack-payload-plugin`](https://github.com/Jose-henry/payload-paystack-plugin) syncs products/transactions with Paystack
- Better if you want **one system** for CMS + orders + Paystack sync
- Requires Node hosting (more ops than Sanity)

**Alternative: Medusa v2 + Paystack plugin**

- Full commerce (cart, orders, inventory modules)
- [`medusa-v2-paystack-payment-plugin`](https://github.com/alexasomba/medusa-v2-paystack-payment-plugin) supports ZAR
- Best for 100+ SKUs, multiple payment methods, fulfillment workflows
- Overkill for a small ministry shop unless significant growth is expected

### CMS Choice Matrix

| Need | Sanity | Payload | Medusa |
|------|--------|---------|--------|
| Manage products elsewhere | ✅ | ✅ | ✅ |
| Minimal hosting burden | ✅ | ⚠️ | ❌ |
| Paystack-native plugin | ❌ (custom API) | ✅ | ✅ |
| Matches current static site | ✅ | ⚠️ | ❌ |
| Order DB included | ❌ (add MongoDB Atlas) | ✅ | ✅ |

**Final recommendation:** **Sanity** for catalog + **MongoDB Atlas** for orders/invoices.

---

## 6. Paystack Integration

Paystack supports **ZAR** with minimum **R 1.00** ([API reference](https://paystack.com/docs/api/)). Amounts are sent in **cents** (× 100).

### 6.1 Payment Flow (recommended: Initialize + Popup)

This is the most secure pattern for a static frontend:

```
Customer clicks "Pay" on checkout.html
        │
        ▼
POST /api/checkout/initialize
  { email, items[], amount, orderRef }
  (server validates prices against CMS or cached price list)
        │
        ▼
Server calls Paystack POST /transaction/initialize
  Authorization: Bearer SECRET_KEY
  { email, amount, currency: "ZAR", reference, metadata: { orderId } }
        │
        ▼
Returns { access_code, reference } to browser
        │
        ▼
Paystack Inline JS: resumeTransaction(access_code)
  OR redirect to authorization_url
        │
        ▼
Customer completes payment in Paystack modal
        │
        ├── onSuccess → browser calls POST /api/checkout/verify { reference }
        │                      server GET /transaction/verify/:reference
        │                      if success → mark order paid, send email
        │
        └── Paystack webhook charge.success (backup / source of truth)
                    POST /api/webhooks/paystack
                    verify x-paystack-signature (HMAC SHA512)
                    update order status idempotently
```

### 6.2 Client-Side Library

Load from CDN (no npm required for static site):

```html
<script src="https://js.paystack.co/v2/inline.js"></script>
```

Or use `@paystack/inline-js` if a bundler is added later.

**Never** put `sk_test_*` or `sk_live_*` in frontend code. Only `pk_test_*` / `pk_live_*` may appear client-side, and only if using legacy popup setup; prefer server-side initialize.

### 6.3 Webhooks (required)

Subscribe to at minimum:

| Event | Action |
|-------|--------|
| `charge.success` | Mark order `paid`, decrement stock flag, trigger confirmation email |
| `charge.failed` | Mark order `payment_failed` |
| `refund.processed` | Mark order `refunded` (if refunds enabled) |

Verify signature on **raw request body** before processing. Return `200 OK` immediately; run heavy work async if needed.

### 6.4 Test Mode

Use Paystack test keys during development. [Test cards](https://paystack.com/docs/payments/test-payments/) documented in Paystack dashboard.

---

## 7. Pages & Routes

All pages follow existing template structure (spinner, navbar, page-header, footer).

| Page | File | Purpose |
|------|------|---------|
| Shop listing | `shop.html` | Grid of products from CMS; category filters |
| Product detail | `product.html?slug=…` | Single product, variants, add to cart |
| Cart | `cart.html` | Line items, qty edit, subtotal, proceed to checkout |
| Checkout | `checkout.html` | Customer details, order summary, Pay button |
| Order confirmation | `order.html?ref=…` | Status after payment; link to invoice |
| Order tracking | `track-order.html` | Lookup by email + order reference |
| Invoice | `invoice.html?ref=…` | Printable invoice (paid orders only) |

### Navbar change

Add **Shop** link to nav on all pages (between Gallery and Prayers, or as dropdown under Get Involved — team decision).

---

## 8. Data Models

### 8.1 Product (Sanity schema sketch)

```javascript
// schemas/product.js
{
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', validation: Rule => Rule.required() },
    { name: 'slug', type: 'slug', options: { source: 'title' } },
    { name: 'description', type: 'text' },
    { name: 'price', type: 'number', description: 'Price in ZAR (e.g. 150.00)' },
    { name: 'compareAtPrice', type: 'number' },
    { name: 'images', type: 'array', of: [{ type: 'image' }] },
    { name: 'category', type: 'reference', to: [{ type: 'category' }] },
    { name: 'inStock', type: 'boolean', initialValue: true },
    { name: 'featured', type: 'boolean' },
    { name: 'sku', type: 'string' },
  ]
}
```

### 8.2 Order (MongoDB document)

```javascript
// orders collection — items embedded in each order document
{
  order_number: "M1615-20260706-K7M2",
  paystack_ref: "M1615_20260706_K7M2",
  customer_email: "customer@example.com",
  customer_name: "Jane Doe",
  status: "pending",
  currency: "ZAR",
  subtotal_cents: 35000,
  shipping_cents: 8000,
  total_cents: 43000,
  created_at: new Date(),
  paid_at: null,
  items: [
    { product_id: "...", title: "...", unit_price_cents: 35000, quantity: 1, line_total_cents: 35000 }
  ]
}
```

Snapshot product title/price on order creation so historical invoices stay accurate if CMS prices change.

### 8.3 Cart (client only)

Store in `localStorage` under key `mark1615_cart`:

```json
{
  "items": [
    { "productId": "abc123", "slug": "kingdom-hoodie", "title": "Kingdom Hoodie", "price": 350, "qty": 1, "imageUrl": "..." }
  ],
  "updatedAt": "2026-07-06T12:00:00Z"
}
```

Re-validate prices server-side at checkout initialize.

---

## 9. JavaScript Module Structure

```
js/
  shop/
    config.js          # CMS project id, API URLs (public only)
    sanityClient.js    # fetch products via GROQ
    cart.js            # localStorage cart CRUD, badge count
    catalog.js         # render shop grid & product detail
    checkout.js        # form validation, call initialize API, Paystack popup
    orders.js          # fetch order status, track-order form
    invoice.js         # render invoice from API
    utils.js           # format ZAR, generate refs
```

Patterns to mirror from `gallery.js`:

- Class or module per concern
- `init()` on `DOMContentLoaded`
- User-facing error messages in the UI
- No secrets in these files

---

## 10. Serverless API Endpoints

Deploy as `netlify/functions/` or `api/` (Vercel).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/checkout/initialize` | Public | Create pending order; return Paystack access_code |
| POST | `/api/checkout/verify` | Public | Verify reference after popup success |
| POST | `/api/webhooks/paystack` | Paystack signature | Webhook handler |
| GET | `/api/orders/:ref` | Email query param must match | Order status for tracking page |
| GET | `/api/orders/:ref/invoice` | Email query param must match | Invoice JSON/HTML |
| GET | `/api/products/prices` | Optional | Price map for server validation (or fetch Sanity server-side) |

### Security rules

1. **Server-side price validation** — never trust client-submitted totals
2. **Rate limit** checkout and track-order endpoints
3. **Order lookup** requires email + reference (or signed token in confirmation link)
4. **Webhook** — verify `x-paystack-signature` with secret key
5. **CORS** — restrict to `mark1615.co.za` in production

### Environment variables

```bash
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...      # optional, for client if needed
SANITY_PROJECT_ID=...
SANITY_DATASET=production
SANITY_API_TOKEN=...                 # server only, for price validation
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=mark1615
ORDER_EMAIL_FROM=shop@mark1615.co.za
RESEND_API_KEY=...                   # or SendGrid, etc.
SITE_URL=https://mark1615.co.za
```

---

## 11. Invoice Specification

### Content

- Mark 1615 logo and contact details
- Invoice number (= `order_number`)
- Date issued, date paid
- Bill to: customer name, email, phone
- Line items table (description, qty, unit price, line total)
- Subtotal, shipping, **total in ZAR**
- Payment method: Paystack
- Paystack transaction reference
- Status badge: PAID

### Delivery

- **Web:** `invoice.html?ref=M1615-…&email=…` — print-friendly CSS (`@media print`)
- **Email:** link to invoice page in order confirmation
- **Phase 2:** PDF generation via server (e.g. `@react-pdf/renderer` or `puppeteer` in function)

---

## 12. Order Tracking Specification

`track-order.html`:

1. Form: Order reference + email address
2. `GET /api/orders/:ref?email=…`
3. Display timeline:

| Status | User-facing label |
|--------|-------------------|
| `pending` | Awaiting payment |
| `paid` | Payment received |
| `fulfilled` | Order completed / shipped |
| `failed` | Payment failed |
| `cancelled` | Cancelled |
| `refunded` | Refunded |

4. Link to invoice when `paid` or `fulfilled`

Confirmation email after purchase includes direct link:  
`https://mark1615.co.za/order.html?ref=M1615-…&email=…`

---

## 13. Email Notifications

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Order created (pending) | Customer | Order summary, pay link if abandoned |
| `charge.success` | Customer | Thank you, order ref, track + invoice links |
| `charge.success` | `team@mark1615.co.za` | New order alert for fulfillment |
| Payment failed | Customer | Retry checkout link |

Use [Resend](https://resend.com), SendGrid, or Netlify-friendly SMTP.

---

## 14. Styling & UX

- Reuse Bootstrap cards, grid, buttons from existing pages
- Cart icon in navbar with badge count (`cart.js`)
- Product grid: 3 columns desktop, 2 tablet, 1 mobile (match gallery/event cards)
- Empty states: "Your cart is empty" with link to shop
- Loading spinners consistent with site `#spinner`
- ZAR formatting: `R 350.00` via `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })`

---

## 15. Implementation Phases

### Phase 0 — Setup (1–2 days)

- [ ] Create Paystack business account (ZA), enable test mode
- [ ] Create Sanity project + product schema
- [ ] Create MongoDB Atlas project + orders tables
- [ ] Choose hosting with serverless (Netlify recommended for static + functions)
- [ ] Add env vars to hosting dashboard
- [ ] Create `docs/` secrets checklist (no keys in git)

### Phase 1 — Catalog (2–3 days)

- [ ] Sanity Studio deployed (`sanity.studio` or embedded)
- [ ] Seed 3–5 test products
- [ ] `js/shop/sanityClient.js` + `catalog.js`
- [ ] `shop.html` and `product.html`
- [ ] Add Shop to navbar across all HTML files

### Phase 2 — Cart & Checkout (3–4 days)

- [ ] `cart.js` + `cart.html`
- [ ] `checkout.html` + customer form
- [ ] Serverless: initialize, verify, webhook
- [ ] Paystack popup integration
- [ ] Order creation in MongoDB Atlas

### Phase 3 — Post-Purchase (2–3 days)

- [ ] `order.html` confirmation page
- [ ] `track-order.html`
- [ ] `invoice.html` + print styles
- [ ] Confirmation emails

### Phase 4 — Hardening (1–2 days)

- [ ] End-to-end test with Paystack test cards
- [ ] Webhook retry / idempotency tests
- [ ] Switch to live keys
- [ ] Admin workflow doc: how to add products, mark orders fulfilled

**Estimated total:** 9–14 dev days for one developer familiar with the stack.

---

## 16. Hosting Recommendation

| Layer | Service | Why |
|-------|---------|-----|
| Static site | **Netlify** or **Cloudflare Pages** | Deploy from git; free SSL |
| Functions | Netlify Functions / CF Workers | Paystack webhook + checkout API |
| CMS | **Sanity** (hosted Studio) | No server maintenance |
| Orders DB | **MongoDB Atlas** (free tier) | Document store, fits serverless |
| Email | Resend | Simple API, good DX |

If the site is already on GitHub, Netlify connect is the fastest path.

---

## 17. Cost Estimate (Monthly, Small Shop)

| Service | Approx. cost |
|---------|--------------|
| Sanity | Free → $0 (within free tier) |
| MongoDB Atlas | Free → $0 |
| Netlify | Free → $0 |
| Paystack | Per-transaction fees (ZA pricing on paystack.com) |
| Resend | Free tier (3k emails/mo) |
| Domain | Existing |

---

## 18. Future Enhancements (Post-v1)

- Discount / promo codes
- Digital products (ebooks, event recordings) with secure download links
- Inventory counts synced from CMS
- Admin dashboard for order fulfillment (MongoDB Atlas UI or Retool)
- Payload or Medusa migration if catalog/complexity grows
- WhatsApp order notifications (fits existing site WhatsApp usage)
- Donations + shop unified receipting

---

## 19. Open Decisions for Stakeholders

1. **Physical shipping** — flat rate (e.g. R 80), free pickup, or both?
2. **Product types** — merch only, books, digital, or mixed?
3. **VAT** — are prices inclusive of VAT? Display tax line on invoice?
4. **CMS editor** — who will manage products? (Sanity Studio login)
5. **Order fulfillment** — manual email to team vs dashboard workflow

---

## 20. References

- [Paystack — Accept payments](https://paystack.com/docs/payments/accept-payments/)
- [Paystack — Inline JS](https://paystack.com/docs/developer-tools/inlinejs/)
- [Paystack — Verify payments](https://paystack.com/docs/payments/verify-payments/)
- [Paystack — Webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack API — ZAR currency](https://paystack.com/docs/api/)
- [Sanity — Ecommerce](https://www.sanity.io/ecommerce)
- [Payload Paystack plugin](https://github.com/Jose-henry/payload-paystack-plugin)
- [Medusa Paystack plugin](https://github.com/alexasomba/medusa-v2-paystack-payment-plugin)

---

## Appendix A — Minimal GROQ Query (Sanity)

```javascript
// Fetch all in-stock products for shop grid
const query = `*[_type == "product" && inStock == true] | order(featured desc, title asc) {
  _id,
  title,
  "slug": slug.current,
  price,
  "imageUrl": images[0].asset->url,
  category->{ title, "slug": slug.current }
}`;
```

## Appendix B — Order Number Format

`M1615-YYYYMMDD-XXXX` where `XXXX` is 4 random alphanumeric chars.  
Example: `M1615-20260706-K7M2`

## Appendix C — Files to Create (Checklist)

```
shop.html
product.html
cart.html
checkout.html
order.html
track-order.html
invoice.html
js/shop/config.js
js/shop/sanityClient.js
js/shop/cart.js
js/shop/catalog.js
js/shop/checkout.js
js/shop/orders.js
js/shop/invoice.js
js/shop/utils.js
netlify/functions/checkout-initialize.js
netlify/functions/checkout-verify.js
netlify/functions/paystack-webhook.js
netlify/functions/get-order.js
netlify/functions/get-invoice.js
sanity/                          # separate Sanity Studio project (optional folder)
netlify.toml                     # redirects, functions config
.env.example                     # template for secrets
```
