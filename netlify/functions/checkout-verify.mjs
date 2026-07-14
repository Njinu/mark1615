import { corsHeaders, jsonResponse, isDemoMode } from './lib/utils.mjs';
import { updateOrderByPaystackRef, getOrderByPaystackRef } from './lib/orders.mjs';
import { verifyTransaction } from './lib/paystack.mjs';

export async function handler(event) {
    const headers = corsHeaders(event.headers.origin);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' }, headers);
    }

    if (isDemoMode()) {
        return jsonResponse(200, { verified: true, demo: true }, headers);
    }

    try {
        const { reference } = JSON.parse(event.body || '{}');
        if (!reference) {
            return jsonResponse(400, { error: 'Reference required' }, headers);
        }

        const tx = await verifyTransaction(reference);
        if (tx.status !== 'success') {
            await updateOrderByPaystackRef(reference, { status: 'failed' }).catch(() => {});
            return jsonResponse(400, { error: 'Payment not successful' }, headers);
        }

        const order = await updateOrderByPaystackRef(reference, {
            status: 'paid',
            paid_at: new Date().toISOString(),
        });

        return jsonResponse(200, {
            verified: true,
            order_number: order?.order_number,
            status: 'paid',
        }, headers);
    } catch (err) {
        console.error('checkout-verify error:', err);
        return jsonResponse(500, { error: err.message || 'Verification failed' }, headers);
    }
}
