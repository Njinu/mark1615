# MongoDB — Mark 1615 Shop orders

Orders are stored in the **`orders`** collection on database **`mark1615`** (configurable via `MONGODB_DB_NAME`).

No manual schema migration is required — documents are created on first checkout.

## Recommended indexes (run once in MongoDB Atlas → Browse Collections → orders → Indexes)

```javascript
db.orders.createIndex({ order_number: 1 }, { unique: true })
db.orders.createIndex({ paystack_ref: 1 }, { unique: true, sparse: true })
db.orders.createIndex({ customer_email: 1 })
```

## Document shape

```javascript
{
  order_number: "M1615-20260706-K7M2",
  paystack_ref: "M1615_20260706_K7M2",
  customer_email: "customer@example.com",
  customer_name: "Jane Doe",
  customer_phone: "+27...",
  status: "pending",  // pending | paid | failed | cancelled | refunded | fulfilled
  currency: "ZAR",
  subtotal_cents: 35000,
  shipping_cents: 8000,
  total_cents: 43000,
  shipping_method: "standard",
  notes: null,
  created_at: ISODate("..."),
  paid_at: null,
  items: [
    {
      product_id: "mock-hoodie",
      title: "Kingdom Hoodie",
      sku: "M1615-HOODIE",
      unit_price_cents: 35000,
      quantity: 1,
      line_total_cents: 35000
    }
  ]
}
```
