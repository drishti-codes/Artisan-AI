const Product = require('./product.model');
const Category = require('../categories/category.model');
const Artisan = require('../artisans/artisan.model');
const AppError = require('../../utils/AppError');
const slugify = require('../../utils/slugify');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const asText = (value) => (typeof value === 'string' ? value.trim() : '');

// Public product list: search, filters, sort, pagination
async function listProducts(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 12, 1), 50);
  const filter = { isActive: true };

  const q = asText(query.q);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { materials: rx }, { region: rx }, { category: rx }];
  }
  if (asText(query.category)) filter.category = asText(query.category).toLowerCase();
  if (asText(query.region)) filter.region = new RegExp(escapeRegex(asText(query.region)), 'i');
  if (asText(query.material)) filter.materials = new RegExp(escapeRegex(asText(query.material)), 'i');

  const min = Number(query.minPrice);
  const max = Number(query.maxPrice);
  if (asText(query.minPrice) && !Number.isNaN(min)) filter.price = { ...filter.price, $gte: min };
  if (asText(query.maxPrice) && !Number.isNaN(max)) filter.price = { ...filter.price, $lte: max };

  const sorts = { 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, rating: { rating: -1 } };
  const sort = sorts[asText(query.sort)] || { _id: 1 }; // "featured" = original order

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// Product details (also counts one view)
async function getProduct(slug) {
  const product = await Product.findOneAndUpdate(
    { slug: slug.toLowerCase(), isActive: true },
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

// Same category first, then other products
async function getRelated(slug, count = 4) {
  const product = await Product.findOne({ slug: slug.toLowerCase(), isActive: true });
  if (!product) throw new AppError('Product not found', 404);
  const same = await Product.find({ category: product.category, slug: { $ne: product.slug }, isActive: true }).limit(count);
  if (same.length >= count) return same;
  const others = await Product.find({ category: { $ne: product.category }, isActive: true }).limit(count - same.length);
  return [...same, ...others];
}

// ---------- seller (artisan) side ----------
const EDITABLE = ['name', 'category', 'price', 'description', 'image', 'gallery', 'materials', 'origin', 'care', 'region', 'stock', 'lowStockThreshold', 'isActive'];

async function uniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await Product.exists({ slug })) slug = `${base}-${n++}`;
  return slug;
}

async function createProduct(user, body) {
  if (!user.artisanId) throw new AppError('Only artisan accounts can add products', 403);
  const artisan = await Artisan.findOne({ slug: user.artisanId });
  if (!artisan) throw new AppError('Artisan profile not found', 404);
  if (!(await Category.exists({ slug: String(body.category).toLowerCase() }))) throw new AppError('Unknown category', 400);

  const data = {};
  EDITABLE.forEach((key) => body[key] !== undefined && (data[key] = body[key]));
  return Product.create({
    ...data,
    slug: await uniqueSlug(body.name),
    artisanId: artisan.slug,
    region: data.region || artisan.region,
    origin: data.origin || artisan.region,
    image: data.image || (data.gallery && data.gallery[0]) || '',
  });
}

async function findOwnedProduct(user, slug) {
  const product = await Product.findOne({ slug: slug.toLowerCase() });
  if (!product) throw new AppError('Product not found', 404);
  if (user.role !== 'admin' && product.artisanId !== user.artisanId) throw new AppError('This is not your product', 403);
  return product;
}

async function updateProduct(user, slug, body) {
  const product = await findOwnedProduct(user, slug);
  if (body.category && !(await Category.exists({ slug: String(body.category).toLowerCase() }))) throw new AppError('Unknown category', 400);
  EDITABLE.forEach((key) => body[key] !== undefined && (product[key] = body[key]));
  await product.save();
  return product;
}

// Soft delete: the product is hidden but old orders still make sense
async function deleteProduct(user, slug) {
  const product = await findOwnedProduct(user, slug);
  product.isActive = false;
  await product.save();
  return { id: product.slug, isActive: false };
}

const listSellerProducts = (user) => Product.find({ artisanId: user.artisanId }).sort({ _id: 1 });

module.exports = { listProducts, getProduct, getRelated, createProduct, updateProduct, deleteProduct, listSellerProducts };
