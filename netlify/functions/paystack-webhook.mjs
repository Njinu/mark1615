import { jsonResponse } from './lib/utils.mjs';
import { updateOrderByPaystackRef, getOrderByPaystackRef } from './lib/orders.mjs';
import { verifyWebhookSignature } from './lib/paystack.mjs';

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    const signature = event.headers['x-paystack-signature'];
    const rawBody = event.body;

    if (!verifyWebhookSignature(rawBody, signature)) {
        return jsonResponse(401, { error: 'Invalid signature' });
    }

    try {
        const payload = JSON.parse(rawBody);
        const { event: eventType, data } = payload;

        if (eventType === 'charge.success' && data?.reference) {
            const existing = await getOrderByPaystackRef(data.reference);
            if (existing && existing.status !== 'paid') {
                await updateOrderByPaystackRef(data.reference, {
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                });
            }
        }

        if (eventType === 'charge.failed' && data?.reference) {
            await updateOrderByPaystackRef(data.reference, { status: 'failed' }).catch(() => {});
        }

        return jsonResponse(200, { received: true });
    } catch (err) {
        console.error('webhook error:', err);
        return jsonResponse(200, { received: true });
    }
}
