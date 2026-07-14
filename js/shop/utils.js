import { SHOP_CONFIG } from './config.js';

const CURRENCY = SHOP_CONFIG.currency || 'ZAR';

export function formatPrice(amount) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: CURRENCY,
    }).format(Number(amount) || 0);
}

export function toCents(amount) {
    return Math.round(Number(amount) * 100);
}

export function fromCents(cents) {
    return (Number(cents) || 0) / 100;
}

export function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

export function showAlert(container, message, type = 'danger') {
    if (!container) return;
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
}

export function setLoading(button, loading, label = 'Processing…') {
    if (!button) return;
    if (loading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${label}`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

export const ORDER_STATUS_LABELS = {
    pending: 'Awaiting payment',
    paid: 'Payment received',
    fulfilled: 'Order completed',
    failed: 'Payment failed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
};

export function statusBadgeClass(status) {
    const map = {
        pending: 'bg-warning text-dark',
        paid: 'bg-success',
        fulfilled: 'bg-primary',
        failed: 'bg-danger',
        cancelled: 'bg-secondary',
        refunded: 'bg-info text-dark',
    };
    return map[status] || 'bg-secondary';
}
