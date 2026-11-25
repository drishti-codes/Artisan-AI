// Seller service – business logic for artisan (seller) features
// Uses AppError for consistent error handling

const slugify = require('slugify');
const Seller = require('./seller.model');
const Product = require('../products/product.model');
const User = require('../auth/user.model');
const Order = require('../orders/order.model');
const Artisan = require('../artisans/artisan.model'); // plural folder name "artisans"
const AppError = require('../../utils/AppError');

/** Helper – fetch seller document (or fallback to Artisan) for the logged‑in user */
async function getSellerForUser(userId) {
  // First try the Seller collection
  let seller = await Seller.findOne({ user: userId });
  if (seller) return seller;
  // Fallback: look at the user's artisanId (slug) and fetch from Artisan collection
  const user = await User.findById(userId);
  if (user && user.artisanId) {
    const artisan = await Artisan.findOne({ slug: user.artisanId });
    // Return a lightweight object mimicking a Seller (only slug needed for queries)
    return artisan ? { slug: artisan.slug, _id: artisan._id } : null;
  }
  return null;
}

/** Onboard seller – create or update seller profile and mark onboarding completed */
async function onboard(user, { shopName, description }) {
  // Try to find existing seller
  let seller = await Seller.findOne({ user: user._id });
  if (!seller) {
    // Need a unique slug across both Seller and Artisan collections
    const baseSlug = slugify(shopName, { lower: true, strict: true });
    let slug = baseSlug;
    let i = 1;
    while (await Seller.findOne({ slug }) || await Artisan.findOne({ slug })) {
      slug = `${baseSlug}-${i++}`;
    }
    seller = await Seller.create({ user: user._id, name: shopName, description, slug });
  } else {
    // Existing seller – keep existing slug unchanged
    seller.name = shopName;
    seller.description = description;
    await seller.save();
  }

  // Update the user record with the (new or existing) slug and flag
  await User.findByIdAndUpdate(user._id, {
    artisanId: seller.slug,
    onboardingCompleted: true,
  });
  return seller;
}

/** Overview stats for the logged‑in artisan */
async function getOverview(user) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);

  const totalProducts = await Product.countDocuments({ artisanId: seller.slug });

  // Orders – only those that contain items belonging to this artisan and are in paid/processing/shipped/delivered
  const relevantStatuses = ['paid', 'processing', 'shipped', 'delivered'];
  const orders = await Order.find({
    status: { $in: relevantStatuses },
    'items.artisanId': seller.slug,
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => ['paid', 'processing'].includes(o.status)).length;

  // Revenue = sum of price * qty for this artisan's items only
  let revenue = 0;
  for (const order of orders) {
    for (const item of order.items) {
      if (item.artisanId === seller.slug) {
        revenue += (item.price || 0) * (item.qty || 0);
      }
    }
  }

  return { totalProducts, totalOrders, pendingOrders, revenue };
}

/** List products belonging to the logged‑in artisan */
async function listProducts(user) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  return await Product.find({ artisanId: seller.slug });
}

/** Create a new product for the logged‑in artisan */
async function createProduct(user, { name, price, category, description }) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let i = 1;
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }
  const product = await Product.create({ slug, name, price, category, description, artisanId: seller.slug });
  return product;
}

/** Update a product – only if it belongs to this artisan */
async function updateProduct(user, productId, updateData) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  const product = await Product.findOne({ _id: productId, artisanId: seller.slug });
  if (!product) return null; // controller will translate to 404
  Object.assign(product, updateData);
  await product.save();
  return product;
}

/** Delete a product – only if it belongs to this artisan */
async function deleteProduct(user, productId) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  return await Product.findOneAndDelete({ _id: productId, artisanId: seller.slug });
}

/** Save delivery API key for artisan */
async function saveDelivery(user, apiKey) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  seller.deliveryApiKey = apiKey;
  await seller.save();
  return { apiKey };
}

/** Get delivery API key */
async function getDelivery(user) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  return { apiKey: seller.deliveryApiKey };
}

/** Stub sales endpoint */
async function getSales(user) {
  // Placeholder – real implementation would aggregate revenue, orders, etc.
  return { totalRevenue: 0, totalOrders: 0, recent: [] };
}

/** Voice onboarding placeholder */
async function voiceOnboard() {
  return { transcription: 'Sample transcription from Bhashini API' };
}

/** List orders received – only those belonging to this artisan */
async function listOrders(user) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  const orders = await Order.find({ 'items.artisanId': seller.slug });
  // Strip payment fields and keep only this artisan's items
  return orders.map(order => {
    const filteredItems = order.items.filter(item => item.artisanId === seller.slug);
    const { payment, ...rest } = order.toObject();
    return { ...rest, items: filteredItems };
  });
}

/** Update order status – enforce allowed transitions */
async function updateOrderStatus(user, orderId, newStatus) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  const order = await Order.findOne({ _id: orderId, 'items.artisanId': seller.slug });
  if (!order) return null; // controller will turn into 404

  const allowedTransitions = {
    paid: ['processing'],
    processing: ['shipped'],
    shipped: ['delivered'],
    delivered: [],
  };

  if (!allowedTransitions[order.status] || !allowedTransitions[order.status].includes(newStatus)) {
    throw new AppError(`Invalid status transition from ${order.status} to ${newStatus}`, 400);
  }

  order.status = newStatus;
  await order.save();
  return order;
}

module.exports = {
  onboard,
  getOverview,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  saveDelivery,
  getDelivery,
  getSales,
  voiceOnboard,
  // orders
  listOrders,
  updateOrderStatus,
  // helper for controllers
  getSellerForUser,
};
