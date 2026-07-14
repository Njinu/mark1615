const PAYSTACK_BASE = 'https://api.paystack.co';

export async function initializeTransaction({ email, amountCents, reference, metadata, callbackUrl }) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error('Paystack not configured');

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: amountCents,
            currency: 'ZAR',
            reference,
            metadata,
            callback_url: callbackUrl,
        }),
    });

    const data = await res.json();
    if (!data.status) {
        throw new Error(data.message || 'Paystack initialization failed');
    }
    return data.data;
}

export async function verifyTransaction(reference) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error('Paystack not configured');

    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secret}` },
    });

    const data = await res.json();
    if (!data.status) {
        throw new Error(data.message || 'Verification failed');
    }
    return data.data;
}

import crypto from 'node:crypto';

export function verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || !signature) return false;

    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    return hash === signature;
}
