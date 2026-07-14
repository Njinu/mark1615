import { fetchProducts, fetchProductBySlug, getCategories } from './sanityClient.js';
import { Cart } from './cart.js';
import { formatPrice, escapeHtml, getQueryParam, showAlert } from './utils.js';

function productCardHtml(product) {
    const outOfStock = !product.inStock;
    const saleBadge = product.compareAtPrice && product.compareAtPrice > product.price
        ? `<span class="shop-badge-sale">Sale</span>` : '';

    return `
        <div class="col-lg-4 col-md-6 wow fadeInUp" data-category="${escapeHtml(product.category?.slug || '')}">
            <div class="shop-product-card h-100 ${outOfStock ? 'shop-out-of-stock' : ''}">
                ${saleBadge}
                <a href="product.html?slug=${encodeURIComponent(product.slug)}" class="shop-product-image-link">
                    <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.title)}" class="shop-product-image">
                </a>
                <div class="shop-product-body">
                    ${product.category ? `<small class="text-primary text-uppercase">${escapeHtml(product.category.title)}</small>` : ''}
                    <h5 class="mt-1 mb-2">
                        <a href="product.html?slug=${encodeURIComponent(product.slug)}" class="text-dark text-decoration-none">
                            ${escapeHtml(product.title)}
                        </a>
                    </h5>
                    <div class="shop-price mb-3">
                        <span class="shop-price-current">${formatPrice(product.price)}</span>
                        ${product.compareAtPrice ? `<span class="shop-price-compare">${formatPrice(product.compareAtPrice)}</span>` : ''}
                    </div>
                    ${outOfStock
                        ? '<span class="badge bg-secondary">Out of stock</span>'
                        : `<button class="btn btn-primary btn-sm shop-add-btn" data-product-id="${escapeHtml(product._id)}">
                               <i class="fa fa-cart-plus me-1"></i> Add to cart
                           </button>`}
                </div>
            </div>
        </div>`;
}

export async function initShopPage() {
    const grid = document.getElementById('shop-grid');
    const filters = document.getElementById('shop-filters');
    const alertBox = document.getElementById('shop-alert');
    if (!grid) return;

    grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';

    let products = [];
    try {
        products = await fetchProducts();
    } catch (err) {
        showAlert(alertBox, 'Could not load products. Please try again later.');
        grid.innerHTML = '';
        return;
    }

    const categories = getCategories(products);
    if (filters && categories.length) {
        filters.innerHTML = `
            <button class="btn btn-outline-primary active me-2 mb-2 shop-filter-btn" data-filter="all">All</button>
            ${categories.map((c) => `
                <button class="btn btn-outline-primary me-2 mb-2 shop-filter-btn" data-filter="${escapeHtml(c.slug)}">
                    ${escapeHtml(c.title)}
                </button>`).join('')}`;
    }

    const productMap = new Map(products.map((p) => [p._id, p]));
    grid.innerHTML = products.map(productCardHtml).join('');

    grid.querySelectorAll('.shop-add-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const product = productMap.get(btn.dataset.productId);
            if (!product) return;
            Cart.addItem(product);
            btn.innerHTML = '<i class="fa fa-check me-1"></i> Added';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa fa-cart-plus me-1"></i> Add to cart';
            }, 1500);
        });
    });

    filters?.querySelectorAll('.shop-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            filters.querySelectorAll('.shop-filter-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            grid.querySelectorAll('[data-category]').forEach((col) => {
                col.style.display = filter === 'all' || col.dataset.category === filter ? '' : 'none';
            });
        });
    });
}

export async function initProductPage() {
    const container = document.getElementById('product-detail');
    const alertBox = document.getElementById('shop-alert');
    const slug = getQueryParam('slug');

    if (!slug || !container) {
        if (container) container.innerHTML = '<p class="text-muted">Product not found.</p>';
        return;
    }

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    const product = await fetchProductBySlug(slug);
    if (!product) {
        container.innerHTML = `
            <div class="text-center py-5">
                <h4>Product not found</h4>
                <a href="shop.html" class="btn btn-primary mt-3">Back to shop</a>
            </div>`;
        return;
    }

    document.title = `${product.title} - Mark 1615 Shop`;

    const outOfStock = !product.inStock;

    container.innerHTML = `
        <div class="row g-5">
            <div class="col-lg-6">
                <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.title)}" class="shop-product-detail-image rounded">
            </div>
            <div class="col-lg-6">
                ${product.category ? `<small class="text-primary text-uppercase">${escapeHtml(product.category.title)}</small>` : ''}
                <h1 class="display-6 mb-3">${escapeHtml(product.title)}</h1>
                <div class="shop-price mb-4">
                    <span class="shop-price-current fs-4">${formatPrice(product.price)}</span>
                    ${product.compareAtPrice ? `<span class="shop-price-compare fs-5">${formatPrice(product.compareAtPrice)}</span>` : ''}
                </div>
                <p class="text-muted mb-4">${escapeHtml(product.description)}</p>
                ${product.sku ? `<p class="small text-muted">SKU: ${escapeHtml(product.sku)}</p>` : ''}
                ${outOfStock
                    ? '<span class="badge bg-secondary fs-6">Out of stock</span>'
                    : `<div class="d-flex align-items-center gap-3 mb-4">
                           <label class="form-label mb-0" for="product-qty">Qty</label>
                           <input type="number" id="product-qty" class="form-control w-auto" value="1" min="1" max="99" style="width:80px">
                       </div>
                       <button id="add-to-cart-btn" class="btn btn-primary py-3 px-5">
                           <i class="fa fa-cart-plus me-2"></i>Add to cart
                       </button>
                       <a href="cart.html" class="btn btn-outline-primary py-3 px-4 ms-2">View cart</a>`}
            </div>
        </div>`;

    if (!outOfStock) {
        document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
            const qty = parseInt(document.getElementById('product-qty')?.value, 10) || 1;
            Cart.addItem(product, qty);
            showAlert(alertBox, `${product.title} added to your cart.`, 'success');
        });
    }
}

export async function initCartPage() {
    const container = document.getElementById('cart-content');
    const summary = document.getElementById('cart-summary');
    if (!container) return;

    const products = await fetchProducts();
    Cart.pruneInvalidItems(new Set(products.map((p) => p._id)));

    function render() {
        const items = Cart.getItems();
        if (!items.length) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fa fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h4>Your cart is empty</h4>
                    <a href="shop.html" class="btn btn-primary mt-3">Browse shop</a>
                </div>`;
            if (summary) summary.innerHTML = '';
            return;
        }

        const subtotal = Cart.getSubtotal();
        const shippingEstimate = Cart.getShipping('paxi-point-standard');
        const total = subtotal + shippingEstimate;

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table shop-cart-table align-middle">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item) => `
                            <tr data-product-id="${escapeHtml(item.productId)}">
                                <td>
                                    <div class="d-flex align-items-center gap-3">
                                        <img src="${escapeHtml(item.imageUrl)}" alt="" class="shop-cart-thumb rounded">
                                        <div>
                                            <a href="product.html?slug=${encodeURIComponent(item.slug)}" class="fw-semibold text-dark">
                                                ${escapeHtml(item.title)}
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td>${formatPrice(item.price)}</td>
                                <td>
                                    <input type="number" class="form-control form-control-sm cart-qty-input" value="${item.qty}" min="1" max="99" style="width:70px">
                                </td>
                                <td class="fw-semibold">${formatPrice(item.price * item.qty)}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-danger cart-remove-btn" title="Remove">
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;

        if (summary) {
            summary.innerHTML = `
                <div class="shop-summary-card bg-light rounded p-4">
                    <h5 class="mb-4">Order summary</h5>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Subtotal</span><span>${formatPrice(subtotal)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Delivery (PAXI)</span>
                        <span>from ${formatPrice(shippingEstimate)}</span>
                    </div>
                    <p class="small text-muted">Choose speed at checkout — <a href="https://www.paxi.co.za/" target="_blank" rel="noopener">PAXI</a> from R59.95</p>
                    <hr>
                    <div class="d-flex justify-content-between fw-bold fs-5 mb-4">
                        <span>Total</span><span>${formatPrice(total)}</span>
                    </div>
                    <a href="checkout.html" class="btn btn-primary w-100 py-3">Proceed to checkout</a>
                    <a href="shop.html" class="btn btn-link w-100 mt-2">Continue shopping</a>
                </div>`;
        }

        container.querySelectorAll('.cart-qty-input').forEach((input) => {
            input.addEventListener('change', () => {
                const row = input.closest('tr');
                Cart.updateQty(row.dataset.productId, parseInt(input.value, 10) || 1);
                render();
            });
        });

        container.querySelectorAll('.cart-remove-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const row = btn.closest('tr');
                Cart.removeItem(row.dataset.productId);
                render();
            });
        });
    }

    render();
    window.addEventListener('cart-updated', render);
}
