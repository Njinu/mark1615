import { Cart } from './cart.js';
import { SHOP_CONFIG, getApiUrl } from './config.js';
import { formatPrice, showAlert, setLoading, toCents } from './utils.js';
import { DELIVERY_OPTIONS, getShippingPrice, getShippingLabel, PAXI_INFO } from './shipping.js';

function generateOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `M1615-${date}-${rand}`;
}

async function initializeCheckout(payload) {
    const res = await fetch(getApiUrl('checkout-initialize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    return data;
}

async function verifyCheckout(reference) {
    const res = await fetch(getApiUrl('checkout-verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    return data;
}

function runDemoCheckout(customer, items, subtotal, shipping, total) {
    const orderNumber = generateOrderNumber();
    const reference = `demo_${orderNumber}`;

    const order = {
        order_number: orderNumber,
        paystack_ref: reference,
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone,
        status: 'paid',
        currency: SHOP_CONFIG.currency,
        subtotal_cents: toCents(subtotal),
        shipping_cents: toCents(shipping),
        total_cents: toCents(total),
        shipping_method: customer.shippingMethod,
        paxi_point: customer.paxiPoint || null,
        delivery_address: customer.deliveryAddress || null,
        notes: [customer.paxiPoint && `PAXI point: ${customer.paxiPoint}`, customer.deliveryAddress && `Address: ${customer.deliveryAddress}`, customer.notes].filter(Boolean).join('\n') || null,
        created_at: new Date().toISOString(),
        items: items.map((item) => ({
            product_id: item.productId,
            title: item.title,
            sku: item.sku,
            unit_price_cents: toCents(item.unitPrice),
            quantity: item.quantity,
            line_total_cents: toCents(item.unitPrice * item.quantity),
        })),
        demo: true,
    };

    Cart.saveDemoOrder(order);
    Cart.clear();
    window.location.href = `order.html?ref=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customer.email)}`;
}

async function runPaystackPopup(accessCode, reference, email) {
    return new Promise((resolve, reject) => {
        if (!window.PaystackPop) {
            reject(new Error('Paystack library not loaded'));
            return;
        }

        const popup = new PaystackPop();
        popup.resumeTransaction(accessCode, {
            onSuccess: () => resolve(reference),
            onCancel: () => reject(new Error('Payment cancelled')),
        });
    });
}

function getSelectedShippingMethod() {
    const selected = document.querySelector('input[name="shipping-method"]:checked');
    return selected?.value || 'paxi-point-standard';
}

function renderDeliveryOptions() {
    const container = document.getElementById('delivery-options');
    if (!container) return;

    container.innerHTML = DELIVERY_OPTIONS.map((opt, i) => `
        <label class="shop-delivery-option ${i === 1 ? 'selected' : ''}">
            <input type="radio" name="shipping-method" value="${opt.id}" class="d-none" ${i === 1 ? 'checked' : ''}>
            <div class="d-flex justify-content-between align-items-start gap-3">
                <div>
                    <div class="fw-semibold">${opt.label}</div>
                    <div class="small text-muted">${opt.description}</div>
                    <div class="small text-primary mt-1">${opt.eta}</div>
                </div>
                <div class="fw-bold text-nowrap">${opt.price === 0 ? 'Free' : formatPrice(opt.price)}</div>
            </div>
        </label>
    `).join('');

    container.querySelectorAll('.shop-delivery-option').forEach((label) => {
        label.addEventListener('click', () => {
            container.querySelectorAll('.shop-delivery-option').forEach((l) => l.classList.remove('selected'));
            label.classList.add('selected');
            label.querySelector('input')?.click();
            onShippingChange();
        });
    });

    container.querySelectorAll('input[name="shipping-method"]').forEach((input) => {
        input.addEventListener('change', onShippingChange);
    });
}

export function initCheckoutPage() {
    const form = document.getElementById('checkout-form');
    const summary = document.getElementById('checkout-summary');
    const alertBox = document.getElementById('shop-alert');
    const payBtn = document.getElementById('pay-btn');
    const paxiPointField = document.getElementById('paxi-point-field');
    const addressField = document.getElementById('delivery-address-field');

    const items = Cart.getItems();
    if (!items.length) {
        window.location.href = 'cart.html';
        return;
    }

    const subtotal = Cart.getSubtotal();
    let shippingMethod = 'paxi-point-standard';
    let shipping = getShippingPrice(shippingMethod);
    let total = subtotal + shipping;

    renderDeliveryOptions();

    function toggleDeliveryFields(method) {
        const isPickup = method === 'pickup';
        const isHome = method.startsWith('paxi-home');
        const isPoint = method.startsWith('paxi-point');

        paxiPointField?.classList.toggle('d-none', !isPoint);
        addressField?.classList.toggle('d-none', !isHome);

        const paxiInput = document.getElementById('paxi-point');
        const addrInput = document.getElementById('delivery-address');
        if (paxiInput) paxiInput.required = isPoint;
        if (addrInput) addrInput.required = isHome;
        if (isPickup) {
            if (paxiInput) paxiInput.required = false;
            if (addrInput) addrInput.required = false;
        }
    }

    function onShippingChange() {
        shippingMethod = getSelectedShippingMethod();
        shipping = getShippingPrice(shippingMethod);
        total = subtotal + shipping;
        toggleDeliveryFields(shippingMethod);
        renderSummary();
    }

    function renderSummary() {
        if (!summary) return;
        summary.innerHTML = `
            <div class="shop-summary-card bg-light rounded p-4">
                <h5 class="mb-3">Your order</h5>
                ${items.map((item) => `
                    <div class="d-flex justify-content-between small mb-2">
                        <span>${item.title} × ${item.qty}</span>
                        <span>${formatPrice(item.price * item.qty)}</span>
                    </div>`).join('')}
                <hr>
                <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Delivery</span>
                    <span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <p class="small text-muted mb-2">${getShippingLabel(shippingMethod)}</p>
                <div class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>${formatPrice(total)}</span></div>
            </div>`;
    }

    toggleDeliveryFields(shippingMethod);
    renderSummary();

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!payBtn) return;

        shippingMethod = getSelectedShippingMethod();
        shipping = getShippingPrice(shippingMethod);
        total = subtotal + shipping;

        const customer = {
            name: document.getElementById('customer-name')?.value.trim(),
            email: document.getElementById('customer-email')?.value.trim(),
            phone: document.getElementById('customer-phone')?.value.trim(),
            shippingMethod,
            paxiPoint: document.getElementById('paxi-point')?.value.trim() || '',
            deliveryAddress: document.getElementById('delivery-address')?.value.trim() || '',
            notes: document.getElementById('order-notes')?.value.trim() || '',
        };

        if (!customer.name || !customer.email) {
            showAlert(alertBox, 'Please enter your name and email.');
            return;
        }

        if (shippingMethod.startsWith('paxi-point') && !customer.paxiPoint) {
            showAlert(alertBox, 'Please enter your preferred PAXI point (store or suburb).');
            return;
        }

        if (shippingMethod.startsWith('paxi-home') && !customer.deliveryAddress) {
            showAlert(alertBox, 'Please enter your delivery address.');
            return;
        }

        const payload = {
            customer,
            items: Cart.toCheckoutPayload(),
            shippingMethod,
        };

        setLoading(payBtn, true, 'Processing…');

        try {
            const result = await initializeCheckout(payload);

            if (result.demo) {
                runDemoCheckout(customer, payload.items, subtotal, shipping, total);
                return;
            }

            if (result.access_code) {
                const reference = await runPaystackPopup(result.access_code, result.reference, customer.email);
                await verifyCheckout(reference);
                Cart.clear();
                window.location.href = `order.html?ref=${encodeURIComponent(result.order_number)}&email=${encodeURIComponent(customer.email)}`;
                return;
            }

            if (result.authorization_url) {
                window.location.href = result.authorization_url;
                return;
            }

            throw new Error('Unexpected checkout response');
        } catch (err) {
            if (err.message === 'Payment cancelled') {
                showAlert(alertBox, 'Payment was cancelled. You can try again when ready.', 'warning');
            } else if (err.name === 'TypeError' || String(err.message).includes('fetch')) {
                runDemoCheckout(customer, payload.items, subtotal, shipping, total);
                return;
            } else {
                showAlert(alertBox, err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(payBtn, false);
        }
    });
}

export { PAXI_INFO };
