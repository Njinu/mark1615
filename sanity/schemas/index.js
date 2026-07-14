export default {
  name: 'default',
  types: [
    {
      name: 'category',
      title: 'Category',
      type: 'document',
      fields: [
        { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
        { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
      ],
    },
    {
      name: 'product',
      title: 'Product',
      type: 'document',
      fields: [
        { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
        { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
        { name: 'description', title: 'Description', type: 'text' },
        { name: 'price', title: 'Price (ZAR)', type: 'number', validation: (Rule) => Rule.required().positive() },
        { name: 'compareAtPrice', title: 'Compare at price', type: 'number' },
        { name: 'images', title: 'Images', type: 'array', of: [{ type: 'image' }] },
        { name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }] },
        { name: 'inStock', title: 'In stock', type: 'boolean', initialValue: true },
        { name: 'featured', title: 'Featured', type: 'boolean', initialValue: false },
        { name: 'sku', title: 'SKU', type: 'string' },
      ],
    },
  ],
};
