import { Cart } from './cart.js';
import { getApiUrl } from './config.js';
import { formatPrice, fromCents, getQueryParam, escapeHtml, showAlert, ORDER_STATUS_LABELS, statusBadgeClass } from './utils.js';
import { getShippingLabel } from './shipping.js';

async function fetchOrder(ref, email) {
    const url = `${getApiUrl('get-order')}?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order not found');
    return data.order;
}

function getOrderLocally(ref, email) {
    return Cart.getDemoOrder(ref, email);
}

function renderOrderTimeline(status) {
    const steps = [
        { key: 'pending', label: 'Order placed' },
        { key: 'paid', label: 'Payment confirmed' },
        { key: 'fulfilled', label: 'Fulfilled' },
    ];

    const statusOrder = ['pending', 'paid', 'fulfilled', 'failed', 'cancelled', 'refunded'];
    const currentIdx = statusOrder.indexOf(status);

    return `
        <div class="shop-timeline d-flex justify-content-between mt-4 mb-4">
            ${steps.map((step, i) => {
                const done = currentIdx >= statusOrder.indexOf(step.key) && status !== 'failed' && status !== 'cancelled';
                const active = status === step.key;
                return `
                    <div class="shop-timeline-step text-center flex-fill ${done ? 'done' : ''} ${active ? 'active' : ''}">
                        <div class="shop-timeline-dot mx-auto mb-2"></div>
                        <small>${step.label}</small>
                    </div>`;
            }).join('')}
        </div>`;
}

function renderOrderDetails(order, container) {
    const items = order.items || [];
    const subtotal = order.subtotal_cents != null ? fromCents(order.subtotal_cents) : items.reduce((s, i) => s + fromCents(i.line_total_cents), 0);
    const shipping = fromCents(order.shipping_cents || 0);
    const total = fromCents(order.total_cents);

    container.innerHTML = `
        <div class="row g-4">
            <div class="col-lg-8">
                <div class="d-flex align-items-center gap-3 mb-4">
                    <h3 class="mb-0">Order ${escapeHtml(order.order_number)}</h3>
                    <span class="badge ${statusBadgeClass(order.status)}">${ORDER_STATUS_LABELS[order.status] || order.status}</span>
                    ${order.demo ? '<span class="badge bg-info text-dark">Demo</span>' : ''}
                </div>
                ${renderOrderTimeline(order.status)}
                <div class="table-responsive">
                    <table class="table">
                        <thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
                        <tbody>
                            ${items.map((item) => `
                                <tr>
                                    <td>${escapeHtml(item.title)}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatPrice(fromCents(item.line_total_cents))}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="bg-light rounded p-4">
                    <h5>Summary</h5>
                    <p class="small mb-1"><strong>Email:</strong> ${escapeHtml(order.customer_email)}</p>
                    ${order.customer_name ? `<p class="small mb-1"><strong>Name:</strong> ${escapeHtml(order.customer_name)}</p>` : ''}
                    ${order.shipping_method ? `<p class="small mb-1"><strong>Delivery:</strong> ${escapeHtml(getShippingLabel(order.shipping_method))}</p>` : ''}
                    ${order.paxi_point ? `<p class="small mb-1"><strong>PAXI point:</strong> ${escapeHtml(order.paxi_point)}</p>` : ''}
                    ${order.paystack_ref ? `<p class="small mb-3"><strong>Reference:</strong> ${escapeHtml(order.paystack_ref)}</p>` : ''}
                    <hr>
                    <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
                    <div class="d-flex justify-content-between mb-2"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                    <div class="d-flex justify-content-between fw-bold"><span>Total</span><span>${formatPrice(total)}</span></div>
                    ${order.status === 'paid' || order.status === 'fulfilled' ? `
                        <a href="invoice.html?ref=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(order.customer_email)}"
                           class="btn btn-outline-primary w-100 mt-4">
                            <i class="fa fa-file-invoice me-2"></i>View invoice
                        </a>` : ''}
                </div>
            </div>
        </div>`;
}

export async function initOrderPage() {
    const container = document.getElementById('order-detail');
    const alertBox = document.getElementById('shop-alert');
    const ref = getQueryParam('ref');
    const email = getQueryParam('email');

    if (!ref || !email || !container) {
        if (container) container.innerHTML = '<p class="text-muted">Missing order reference or email.</p>';
        return;
    }

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    try {
        let order = getOrderLocally(ref, email);
        if (!order) {
            order = await fetchOrder(ref, email);
        }
        renderOrderDetails(order, container);
    } catch (err) {
        showAlert(alertBox, err.message || 'Could not load order.');
        container.innerHTML = '';
    }
}

export function initTrackOrderPage() {
    const form = document.getElementById('track-order-form');
    const result = document.getElementById('track-order-result');
    const alertBox = document.getElementById('shop-alert');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ref = document.getElementById('track-ref')?.value.trim();
        const email = document.getElementById('track-email')?.value.trim();

        if (!ref || !email) {
            showAlert(alertBox, 'Please enter both order reference and email.');
            return;
        }

        if (result) result.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

        try {
            let order = getOrderLocally(ref, email);
            if (!order) {
                order = await fetchOrder(ref, email);
            }
            renderOrderDetails(order, result);
        } catch (err) {
            showAlert(alertBox, err.message || 'Order not found. Check your reference and email.');
            if (result) result.innerHTML = '';
        }
    });
}
