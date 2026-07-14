import { getDb, ordersCollection, emailFilter } from './db.mjs';

function buildOrderNotes(customer, extraNotes) {
    const parts = [];
    if (customer.paxiPoint) parts.push(`PAXI point: ${customer.paxiPoint}`);
    if (customer.deliveryAddress) parts.push(`Address: ${customer.deliveryAddress}`);
    if (extraNotes) parts.push(extraNotes);
    if (customer.notes && customer.notes !== extraNotes) parts.push(customer.notes);
    return parts.length ? parts.join('\n') : null;
}

function mapItems(items) {
    return items.map((item) => ({
        product_id: item.productId,
        title: item.title,
        sku: item.sku || null,
        unit_price_cents: Math.round(item.unitPrice * 100),
        quantity: item.quantity,
        line_total_cents: Math.round(item.unitPrice * item.quantity * 100),
    }));
}

export async function createOrder({ orderNumber, customer, items, subtotalCents, shippingCents, totalCents, shippingMethod, notes, paystackRef, status = 'pending' }) {
    const db = await getDb();
    if (!db) throw new Error('Database not configured');

    const now = new Date();
    const order = {
        order_number: orderNumber,
        paystack_ref: paystackRef || null,
        customer_email: customer.email.trim(),
        customer_name: customer.name,
        customer_phone: customer.phone || null,
        status,
        currency: 'ZAR',
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        shipping_method: shippingMethod || 'paxi-point-standard',
        paxi_point: customer.paxiPoint || null,
        delivery_address: customer.deliveryAddress || null,
        notes: buildOrderNotes(customer, notes),
        created_at: now,
        paid_at: status === 'paid' ? now : null,
        items: mapItems(items),
    };

    const result = await ordersCollection(db).insertOne(order);
    return { ...order, _id: result.insertedId };
}

export async function getOrderByRef(ref, email) {
    const db = await getDb();
    if (!db) throw new Error('Database not configured');

    return ordersCollection(db).findOne({
        order_number: ref,
        customer_email: emailFilter(email),
    });
}

export async function updateOrderByPaystackRef(paystackRef, updates) {
    const db = await getDb();
    if (!db) throw new Error('Database not configured');

    const set = { ...updates };
    if (updates.paid_at && typeof updates.paid_at === 'string') {
        set.paid_at = new Date(updates.paid_at);
    }

    const result = await ordersCollection(db).findOneAndUpdate(
        { paystack_ref: paystackRef },
        { $set: set },
        { returnDocument: 'after' }
    );

    return result;
}

export async function getOrderByPaystackRef(paystackRef) {
    const db = await getDb();
    if (!db) return null;

    return ordersCollection(db).findOne({ paystack_ref: paystackRef });
}

export function validateLineItems(items) {
    if (!Array.isArray(items) || !items.length) {
        throw new Error('Cart is empty');
    }

    return items.map((item) => {
        const unitPrice = Number(item.unitPrice);
        const quantity = parseInt(item.quantity, 10);
        if (!item.productId || !item.title || !unitPrice || unitPrice <= 0 || !quantity || quantity < 1) {
            throw new Error('Invalid cart item');
        }
        return {
            productId: item.productId,
            title: item.title,
            sku: item.sku || '',
            unitPrice,
            quantity,
        };
    });
}

import { getShippingCents, isValidShippingMethod } from './shipping.mjs';

export function calcTotals(items, shippingMethod) {
    const subtotalCents = items.reduce((sum, i) => sum + Math.round(i.unitPrice * i.quantity * 100), 0);
    const method = isValidShippingMethod(shippingMethod) ? shippingMethod : 'paxi-point-standard';
    const shippingCents = getShippingCents(method);
    const totalCents = subtotalCents + shippingCents;
    return { subtotalCents, shippingCents, totalCents };
}
