/**
 * PAXI delivery options — https://www.paxi.co.za/
 * Rates from R59.95 store-to-store; final cost varies by speed and destination type.
 */
export const PAXI_INFO = {
    url: 'https://www.paxi.co.za/',
    logo: 'img/paxi-logo.webp',
    tagline: 'Send it easy, send it with PAXI',
    note: 'We ship hoodies via PAXI. Prices start from R59.95 for standard PAXI point delivery and increase for faster service or door delivery.',
};

export const DELIVERY_OPTIONS = [
    {
        id: 'pickup',
        label: 'Collect at Workshop 17, Rosebank',
        description: 'Free pickup — no delivery fee',
        price: 0,
        eta: 'We will email when ready',
    },
    {
        id: 'paxi-point-standard',
        label: 'PAXI point — Standard',
        description: 'Deliver to your nearest PEP / Tekkie Town / Shoe City PAXI point',
        price: 59.95,
        eta: 'Approx. 3–5 business days',
    },
    {
        id: 'paxi-point-express',
        label: 'PAXI point — Express',
        description: 'Faster delivery to a PAXI point near you',
        price: 79.95,
        eta: 'Approx. 1–2 business days',
    },
    {
        id: 'paxi-home-standard',
        label: 'Door delivery — Standard',
        description: 'PAXI delivers to your home or office address',
        price: 89.95,
        eta: 'Approx. 3–5 business days',
    },
    {
        id: 'paxi-home-express',
        label: 'Door delivery — Express',
        description: 'Fastest PAXI delivery to your door',
        price: 109.95,
        eta: 'Approx. 1–2 business days',
    },
];

export function getDeliveryOption(id) {
    return DELIVERY_OPTIONS.find((o) => o.id === id) || DELIVERY_OPTIONS[1];
}

export function getShippingPrice(methodId) {
    return getDeliveryOption(methodId).price;
}

export function getShippingLabel(methodId) {
    const opt = getDeliveryOption(methodId);
    if (opt.price === 0) return opt.label;
    return `PAXI — ${opt.label}`;
}
