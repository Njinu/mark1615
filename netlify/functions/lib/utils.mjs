export function isDbConfigured() {
    return Boolean(process.env.MONGODB_URI);
}

export function isPaystackConfigured() {
    return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function isDemoMode() {
    return process.env.SHOP_DEMO_MODE === 'true' || (!isDbConfigured() && !isPaystackConfigured());
}

export function corsHeaders(origin) {
    const allowed = process.env.SITE_URL || '*';
    const allowOrigin = allowed === '*' ? '*' : (origin && origin.startsWith(allowed.replace(/\/$/, '')) ? origin : allowed);
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
    };
}

export function jsonResponse(statusCode, body, headers = {}) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    };
}

export function generateOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `M1615-${date}-${rand}`;
}

export function toCents(amount) {
    return Math.round(Number(amount) * 100);
}

export const SHIPPING_FLAT = Number(process.env.SHIPPING_FLAT_RATE || 80);
export const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD || 500);

export function calcShipping(subtotalCents) {
    const subtotal = subtotalCents / 100;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    return toCents(SHIPPING_FLAT);
}
