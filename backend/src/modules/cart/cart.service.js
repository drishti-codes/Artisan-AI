const Cart = require('./cart.model');
const Product = require('../products/product.model');
const AppError = require('../../utils/AppError');

const MAX_PER_ITEM = 10;

const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId, items: [] } }, { upsert: true, new: true });

// Cart with live data from the database. Products that no longer exist are removed.
async function hydrate(cart) {
  const products = await Product.find({ slug: { $in: cart.items.map((i) => i.productId) }, isActive: true });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const stillValid = cart.items.filter((i) => bySlug.has(i.productId));
  if (stillValid.length !== cart.items.length) {
    cart.items = stillValid;
    await cart.save();
  }

  const items = cart.items.map((i) => {
    const p = bySlug.get(i.productId);
    return { id: p.slug, name: p.name, price: p.price, image: p.image, artisanId: p.artisanId, stock: p.stock, qty: i.qty };
  });
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { items, count: items.reduce((n, i) => n + i.qty, 0), subtotal };
}

const getCart = async (userId) => hydrate(await getOrCreateCart(userId));

async function findActiveProduct(slug) {
  const product = await Product.findOne({ slug: String(slug).toLowerCase(), isActive: true });
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

function checkQty(product, qty) {
  if (qty > MAX_PER_ITEM) throw new AppError(`You can buy at most ${MAX_PER_ITEM} of one product`, 400);
  if (qty > product.stock) throw new AppError(`Only ${product.stock} left in stock for ${product.name}`, 409);
}

async function addItem(userId, productId, qty) {
  const product = await findActiveProduct(productId);
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((i) => i.productId === product.slug);
  const newQty = (existing ? existing.qty : 0) + qty;
  checkQty(product, newQty);
  if (existing) existing.qty = newQty;
  else cart.items.push({ productId: product.slug, qty: newQty });
  await cart.save();
  return hydrate(cart);
}

async function updateItem(userId, productId, qty) {
  const product = await findActiveProduct(productId);
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((i) => i.productId === product.slug);
  if (!existing) throw new AppError('This product is not in your cart', 404);
  checkQty(product, qty);
  existing.qty = qty;
  await cart.save();
  return hydrate(cart);
}

async function removeItem(userId, productId) {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((i) => i.productId !== String(productId).toLowerCase());
  await cart.save();
  return hydrate(cart);
}

async function clearCart(userId) {
  await Cart.updateOne({ user: userId }, { $set: { items: [] } });
  return { items: [], count: 0, subtotal: 0 };
}

// Merge the guest cart (from localStorage) into the user's saved cart after login
async function mergeCart(userId, guestItems) {
  const cart = await getOrCreateCart(userId);
  const products = await Product.find({ slug: { $in: guestItems.map((i) => String(i.id).toLowerCase()) }, isActive: true });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  for (const guest of guestItems) {
    const product = bySlug.get(String(guest.id).toLowerCase());
    if (!product || product.stock < 1) continue; // skip unknown or sold-out products
    const existing = cart.items.find((i) => i.productId === product.slug);
    const wanted = (existing ? existing.qty : 0) + guest.qty;
    const qty = Math.min(wanted, product.stock, MAX_PER_ITEM);
    if (existing) existing.qty = qty;
    else cart.items.push({ productId: product.slug, qty });
  }
  await cart.save();
  return hydrate(cart);
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, mergeCart, getOrCreateCart, hydrate };
