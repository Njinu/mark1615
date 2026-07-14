import {
    corsHeaders,
    jsonResponse,
    generateOrderNumber,
    isDemoMode,
    isPaystackConfigured,
} from './lib/utils.mjs';
import { createOrder, validateLineItems, calcTotals } from './lib/orders.mjs';
import { initializeTransaction } from './lib/paystack.mjs';

export async function handler(event) {
    const headers = corsHeaders(event.headers.origin);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' }, headers);
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { customer, items, shippingMethod } = body;

        if (!customer?.email || !customer?.name) {
            return jsonResponse(400, { error: 'Name and email are required' }, headers);
        }

        const validatedItems = validateLineItems(items);
        const { subtotalCents, shippingCents, totalCents } = calcTotals(validatedItems, shippingMethod);
        const orderNumber = generateOrderNumber();

        if (isDemoMode()) {
            return jsonResponse(200, { demo: true, order_number: orderNumber }, headers);
        }

        if (!isPaystackConfigured()) {
            return jsonResponse(503, { error: 'Payment system not configured' }, headers);
        }

        const paystackRef = orderNumber.replace(/-/g, '_');
        await createOrder({
            orderNumber,
            customer,
            items: validatedItems,
            subtotalCents,
            shippingCents,
            totalCents,
            shippingMethod,
            notes: customer.notes,
            paystackRef,
            status: 'pending',
        });

        const siteUrl = (process.env.SITE_URL || 'https://mark1615.co.za').replace(/\/$/, '');
        const paystackData = await initializeTransaction({
            email: customer.email,
            amountCents: totalCents,
            reference: paystackRef,
            metadata: { order_number: orderNumber, customer_name: customer.name },
            callbackUrl: `${siteUrl}/order.html?ref=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customer.email)}`,
        });

        return jsonResponse(200, {
            order_number: orderNumber,
            reference: paystackRef,
            access_code: paystackData.access_code,
            authorization_url: paystackData.authorization_url,
        }, headers);
    } catch (err) {
        console.error('checkout-initialize error:', err);
        return jsonResponse(500, { error: err.message || 'Checkout failed' }, headers);
    }
}
