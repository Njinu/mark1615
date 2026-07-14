import { SHOP_CONFIG } from './config.js';
import { fromCents, toCents } from './utils.js';
import { getShippingPrice } from './shipping.js';

const CART_KEY = 'mark1615_cart';
const DEMO_ORDERS_KEY = 'mark1615_demo_orders';

export class Cart {
    static get() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            if (!raw) return { items: [], updatedAt: null };
            return JSON.parse(raw);
        } catch {
            return { items: [], updatedAt: null };
        }
    }

    static save(cart) {
        cart.updatedAt = new Date().toISOString();
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        Cart.updateNavBadge();
        window.dispatchEvent(new CustomEvent('cart-updated'));
    }

    static getItems() {
        return Cart.get().items;
    }

    /** Drop cart lines that no longer exist in the catalog (e.g. after product updates). */
    static pruneInvalidItems(validProductIds) {
        if (!validProductIds?.size) return;
        const cart = Cart.get();
        const before = cart.items.length;
        cart.items = cart.items.filter((item) => validProductIds.has(item.productId));
        if (cart.items.length !== before) Cart.save(cart);
    }

    static getItemCount() {
        return Cart.getItems().reduce((sum, item) => sum + item.qty, 0);
    }

    static getSubtotal() {
        return Cart.getItems().reduce((sum, item) => sum + item.price * item.qty, 0);
    }

    static getShipping(methodId = 'paxi-point-standard') {
        return getShippingPrice(methodId);
    }

    static getTotal(subtotal, methodId = 'paxi-point-standard') {
        return subtotal + Cart.getShipping(methodId);
    }

    static addItem(product, qty = 1) {
        const cart = Cart.get();
        const existing = cart.items.find((i) => i.productId === product._id);
        if (existing) {
            existing.qty += qty;
        } else {
            cart.items.push({
                productId: product._id,
                slug: product.slug,
                title: product.title,
                price: product.price,
                qty,
                imageUrl: product.imageUrl,
                sku: product.sku || '',
            });
        }
        Cart.save(cart);
    }

    static updateQty(productId, qty) {
        const cart = Cart.get();
        const item = cart.items.find((i) => i.productId === productId);
        if (!item) return;
        if (qty <= 0) {
            cart.items = cart.items.filter((i) => i.productId !== productId);
        } else {
            item.qty = qty;
        }
        Cart.save(cart);
    }

    static removeItem(productId) {
        const cart = Cart.get();
        cart.items = cart.items.filter((i) => i.productId !== productId);
        Cart.save(cart);
    }

    static clear() {
        localStorage.removeItem(CART_KEY);
        Cart.updateNavBadge();
        window.dispatchEvent(new CustomEvent('cart-updated'));
    }

    static updateNavBadge() {
        const badge = document.getElementById('nav-cart-count');
        const count = Cart.getItemCount();
        if (!badge) return;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    static toCheckoutPayload() {
        return Cart.getItems().map((item) => ({
            productId: item.productId,
            title: item.title,
            sku: item.sku,
            unitPrice: item.price,
            quantity: item.qty,
        }));
    }

    /** Demo mode: persist order locally when API is unavailable */
    static saveDemoOrder(order) {
        const orders = Cart.getDemoOrders();
        orders[order.order_number] = order;
        localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
    }

    static getDemoOrders() {
        try {
            return JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) || '{}');
        } catch {
            return {};
        }
    }

    static getDemoOrder(ref, email) {
        const order = Cart.getDemoOrders()[ref];
        if (!order) return null;
        if (order.customer_email.toLowerCase() !== email.toLowerCase()) return null;
        return order;
    }
}

document.addEventListener('DOMContentLoaded', () => Cart.updateNavBadge());
