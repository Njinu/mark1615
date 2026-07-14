/** PAXI delivery rates — keep in sync with js/shop/shipping.js */
export const DELIVERY_RATES = {
    pickup: 0,
    'paxi-point-standard': 59.95,
    'paxi-point-express': 79.95,
    'paxi-home-standard': 89.95,
    'paxi-home-express': 109.95,
};

export function getShippingCents(methodId) {
    const rate = DELIVERY_RATES[methodId];
    if (rate === undefined) return Math.round(DELIVERY_RATES['paxi-point-standard'] * 100);
    return Math.round(rate * 100);
}

export function isValidShippingMethod(methodId) {
    return methodId in DELIVERY_RATES;
}
