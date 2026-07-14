import { Cart } from './cart.js';
import { getApiUrl, SHOP_CONFIG } from './config.js';
import { formatPrice, fromCents, getQueryParam, escapeHtml, showAlert } from './utils.js';

async function fetchInvoice(ref, email) {
    const url = `${getApiUrl('get-invoice')}?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invoice not available');
    return data.order;
}

function renderInvoice(order, container) {
    const items = order.items || [];
    const subtotal = fromCents(order.subtotal_cents);
    const shipping = fromCents(order.shipping_cents || 0);
    const total = fromCents(order.total_cents);
    const paidDate = order.paid_at ? new Date(order.paid_at).toLocaleDateString('en-ZA') : '—';
    const issuedDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA');

    container.innerHTML = `
        <div class="shop-invoice" id="printable-invoice">
            <div class="d-flex justify-content-between align-items-start mb-5">
                <div>
                    <h1 class="fw-bold text-primary mb-1">Mark<span class="text-dark">1615</span></h1>
                    <p class="small text-muted mb-0">Workshop 17, The Bank, Rosebank, South Africa</p>
                    <p class="small text-muted">${SHOP_CONFIG.supportEmail}</p>
                </div>
                <div class="text-end">
                    <h2 class="h4 mb-1">INVOICE</h2>
                    <p class="mb-0"><strong>#${escapeHtml(order.order_number)}</strong></p>
                    <p class="small text-muted mb-0">Issued: ${issuedDate}</p>
                    <p class="small text-muted">Paid: ${paidDate}</p>
                    ${order.demo ? '<span class="badge bg-info text-dark mt-2">Demo</span>' : ''}
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <h6 class="text-uppercase text-muted">Bill to</h6>
                    <p class="mb-0 fw-semibold">${escapeHtml(order.customer_name || '—')}</p>
                    <p class="mb-0">${escapeHtml(order.customer_email)}</p>
                    ${order.customer_phone ? `<p class="mb-0">${escapeHtml(order.customer_phone)}</p>` : ''}
                </div>
                <div class="col-md-6 text-md-end">
                    <h6 class="text-uppercase text-muted">Payment</h6>
                    <p class="mb-0">Paystack</p>
                    ${order.paystack_ref ? `<p class="small text-muted mb-0">Ref: ${escapeHtml(order.paystack_ref)}</p>` : ''}
                    <span class="badge bg-success mt-2">PAID</span>
                </div>
            </div>

            <table class="table table-bordered shop-invoice-table">
                <thead class="table-light">
                    <tr>
                        <th>Description</th>
                        <th class="text-center">Qty</th>
                        <th class="text-end">Unit price</th>
                        <th class="text-end">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item) => `
                        <tr>
                            <td>${escapeHtml(item.title)}${item.sku ? ` <small class="text-muted">(${escapeHtml(item.sku)})</small>` : ''}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-end">${formatPrice(fromCents(item.unit_price_cents))}</td>
                            <td class="text-end">${formatPrice(fromCents(item.line_total_cents))}</td>
                        </tr>`).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-end">Subtotal</td>
                        <td class="text-end">${formatPrice(subtotal)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-end">Shipping</td>
                        <td class="text-end">${shipping === 0 ? 'Free' : formatPrice(shipping)}</td>
                    </tr>
                    <tr class="fw-bold">
                        <td colspan="3" class="text-end">Total (${order.currency || 'ZAR'})</td>
                        <td class="text-end">${formatPrice(total)}</td>
                    </tr>
                </tfoot>
            </table>

            <p class="small text-muted text-center mt-5">Thank you for supporting Mark 1615. All prices in South African Rand (ZAR).</p>
        </div>

        <div class="text-center mt-4 no-print">
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fa fa-print me-2"></i>Print invoice
            </button>
            <a href="track-order.html" class="btn btn-outline-primary ms-2">Track another order</a>
        </div>`;
}

export async function initInvoicePage() {
    const container = document.getElementById('invoice-content');
    const alertBox = document.getElementById('shop-alert');
    const ref = getQueryParam('ref');
    const email = getQueryParam('email');

    if (!ref || !email || !container) {
        if (container) container.innerHTML = '<p class="text-muted">Missing invoice reference.</p>';
        return;
    }

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    try {
        let order = Cart.getDemoOrder(ref, email);
        if (!order) {
            order = await fetchInvoice(ref, email);
        }

        if (order.status !== 'paid' && order.status !== 'fulfilled') {
            throw new Error('Invoice is only available for paid orders.');
        }

        renderInvoice(order, container);
    } catch (err) {
        showAlert(alertBox, err.message || 'Could not load invoice.');
        container.innerHTML = '';
    }
}
