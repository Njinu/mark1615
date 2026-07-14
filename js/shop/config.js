/**
 * Shop configuration — update when Sanity / API credentials are ready.
 * Mock products are used automatically when Sanity is not configured.
 */
export const SHOP_CONFIG = {
    apiBase: '/.netlify/functions',
    sanityProjectId: '', // e.g. 'abc123xy'
    sanityDataset: 'production',
    currency: 'ZAR',
    siteName: 'Mark 1615 Shop',
    supportEmail: 'team@mark1615.co.za',
    pickupAddress: 'Workshop 17, The Bank, Rosebank, Johannesburg',
};

export function isSanityConfigured() {
    return Boolean(SHOP_CONFIG.sanityProjectId);
}

export function getApiUrl(path) {
    const base = SHOP_CONFIG.apiBase.replace(/\/$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
}
