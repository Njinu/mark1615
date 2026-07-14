# Mark 1615 — Project Documentation

| Document | Description |
|----------|-------------|
| [SHOP_SPEC.md](./SHOP_SPEC.md) | Full technical specification for adding shop, Paystack payments, CMS integration, invoices, and order tracking |

## Quick Summary

The shop extends the existing static HTML site (no full React rewrite). Products are managed in **Sanity** (or mock data until configured). Payments go through **Paystack** (ZAR). A small **serverless API** handles secrets, verification, and webhooks. Orders and invoices are stored in **MongoDB Atlas**.

**Try it now (demo mode):** Open `shop.html` in a browser, add items to cart, checkout — demo orders save to localStorage.

**Production:** Run `npm install` then `npm run dev` (local server, no Netlify CLI needed). Use `npm run dev:netlify` only if you need the full Netlify proxy. Set env vars per `.env.example`.

Start with [SHOP_SPEC.md §15 Implementation Phases](./SHOP_SPEC.md#15-implementation-phases) for the full production setup.
