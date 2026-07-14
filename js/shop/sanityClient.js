import { SHOP_CONFIG, isSanityConfigured } from './config.js';
import { MOCK_PRODUCTS } from './productsData.js';

const PRODUCTS_QUERY = `*[_type == "product"] | order(featured desc, title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  price,
  compareAtPrice,
  "imageUrl": images[0].asset->url,
  inStock,
  featured,
  sku,
  category->{ title, "slug": slug.current }
}`;

const PRODUCT_BY_SLUG_QUERY = `*[_type == "product" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  price,
  compareAtPrice,
  "imageUrl": images[0].asset->url,
  inStock,
  featured,
  sku,
  category->{ title, "slug": slug.current }
}`;

async function sanityFetch(query, params = {}) {
    const url = `https://${SHOP_CONFIG.sanityProjectId}.api.sanity.io/v2024-01-01/data/query/${SHOP_CONFIG.sanityDataset}?query=${encodeURIComponent(query)}&${new URLSearchParams(
        Object.entries(params).map(([k, v]) => [`$${k}`, JSON.stringify(v)])
    ).toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products from CMS');
    const data = await res.json();
    return data.result;
}

export async function fetchProducts() {
    if (!isSanityConfigured()) {
        return MOCK_PRODUCTS;
    }
    try {
        const products = await sanityFetch(PRODUCTS_QUERY);
        return products?.length ? products : MOCK_PRODUCTS;
    } catch (err) {
        console.warn('Sanity fetch failed, using mock products:', err);
        return MOCK_PRODUCTS;
    }
}

export async function fetchProductBySlug(slug) {
    if (!slug) return null;

    if (!isSanityConfigured()) {
        return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
    }

    try {
        const product = await sanityFetch(PRODUCT_BY_SLUG_QUERY, { slug });
        if (product) return product;
    } catch (err) {
        console.warn('Sanity fetch failed:', err);
    }

    return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
}

export function getCategories(products) {
    const cats = new Map();
    products.forEach((p) => {
        if (p.category?.slug) {
            cats.set(p.category.slug, p.category.title);
        }
    });
    return Array.from(cats.entries()).map(([slug, title]) => ({ slug, title }));
}
