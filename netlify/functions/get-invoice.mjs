import { corsHeaders, jsonResponse, isDemoMode } from './lib/utils.mjs';
import { getOrderByRef } from './lib/orders.mjs';

export async function handler(event) {
    const headers = corsHeaders(event.headers.origin);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return jsonResponse(405, { error: 'Method not allowed' }, headers);
    }

    const params = event.queryStringParameters || {};
    const ref = params.ref?.trim();
    const email = params.email?.trim();

    if (!ref || !email) {
        return jsonResponse(400, { error: 'Order reference and email are required' }, headers);
    }

    if (isDemoMode()) {
        return jsonResponse(404, { error: 'Invoice not available in demo mode from server.' }, headers);
    }

    try {
        const order = await getOrderByRef(ref, email);
        if (!order) {
            return jsonResponse(404, { error: 'Order not found' }, headers);
        }

        if (order.status !== 'paid' && order.status !== 'fulfilled') {
            return jsonResponse(403, { error: 'Invoice is only available for paid orders' }, headers);
        }

        return jsonResponse(200, { order }, headers);
    } catch (err) {
        console.error('get-invoice error:', err);
        return jsonResponse(500, { error: 'Could not fetch invoice' }, headers);
    }
}
