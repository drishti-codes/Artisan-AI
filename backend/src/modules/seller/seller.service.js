// Seller service – business logic for artisan (seller) features
// Uses AppError for consistent error handling

const mongoose = require('mongoose');
const slugify = require('slugify');
const Seller = require('./seller.model');
const Product = require('../products/product.model');
const User = require('../auth/user.model');
const Order = require('../orders/order.model');
const Artisan = require('../artisans/artisan.model');
const Category = require('../categories/category.model');
const Story = require('../stories/story.model');
const AppError = require('../../utils/AppError');

/** Validate that an uploaded photo URL starts with PUBLIC_BASE_URL + '/uploads/' */
function validateUploadUrl(url, fieldLabel = 'Image') {
  if (!url) return '';
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const expectedPrefix = `${base}/uploads/`;
  if (!url.startsWith(expectedPrefix)) {
    throw new AppError(`${fieldLabel} URL must come from /api/seller/upload`, 400);
  }
  return url;
}

/** Helper – fetch seller document (or fallback to Artisan) for the logged-in user */
async function getSellerForUser(userId) {
  const seller = await Seller.findOne({ user: userId });
  if (seller) return seller;
  const user = await User.findById(userId);
  if (user && user.artisanId) {
    const artisan = await Artisan.findOne({ slug: user.artisanId });
    return artisan
      ? { slug: artisan.slug, _id: artisan._id, name: artisan.shopName || artisan.name, description: artisan.bio, deliveryApiKey: '' }
      : null;
  }
  return null;
}

/** Helper – fetch merged Seller + Artisan + Story profile for onboarding/profile forms */
async function getFullProfile(userId) {
  const seller = await getSellerForUser(userId);
  if (!seller) return null;
  const [artisan, story, user] = await Promise.all([
    Artisan.findOne({ slug: seller.slug }).lean(),
    Story.findOne({ artisanId: seller.slug }).lean(),
    User.findById(userId).lean(),
  ]);
  const region = artisan?.region || '';
  const parts = region.split(',').map((s) => s.trim());
  const city = parts[0] || '';
  const state = parts.slice(1).join(', ') || '';

  return {
    slug: seller.slug,
    name: artisan?.name || user?.name || '',
    shopName: artisan?.shopName || seller.name || '',
    description: seller.description || artisan?.bio || '',
    deliveryApiKey: seller.deliveryApiKey || '',
    craft: artisan?.craft || '',
    region,
    city,
    state,
    years: artisan?.years ?? 0,
    bio: artisan?.bio || seller.description || '',
    image: artisan?.image || '',
    cover: artisan?.cover || '',
    storyTitle: story?.title || '',
    storyBody: artisan?.story || '',
  };
}

/** Generate a unique slug across Seller and Artisan */
async function uniqueArtisanSlug(personalName) {
  const baseSlug = slugify(personalName, { lower: true, strict: true }) || 'artisan';
  let slug = baseSlug;
  let i = 1;
  while ((await Seller.findOne({ slug })) || (await Artisan.findOne({ slug }))) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

/** Generate a unique slug for Story */
async function uniqueStorySlug(title) {
  const baseSlug = slugify(title, { lower: true, strict: true }) || 'artisan-story';
  let slug = baseSlug;
  let i = 1;
  while (await Story.findOne({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

/** Onboard / update seller & public Artisan + Story documents */
async function onboard(user, data) {
  const name = String(data.name || user.name || '').trim();
  const shopName = String(data.shopName || '').trim();
  const craft = String(data.craft || '').trim();
  const city = String(data.city || '').trim();
  const state = String(data.state || '').trim();
  const region = [city, state].filter(Boolean).join(', ') || String(data.region || '').trim();
  const years = Number(data.years) || 0;
  const bio = String(data.bio ?? data.description ?? '').trim();
  const image = validateUploadUrl(String(data.image || '').trim(), 'Profile photo');
  const cover = validateUploadUrl(String(data.cover || '').trim(), 'Cover photo');
  const storyTitle = String(data.storyTitle || '').trim();
  const storyBody = String(data.storyBody || '').trim();

  let seller = await Seller.findOne({ user: user._id });
  if (!seller) {
    // Generate slug once from personal name
    const slug = user.artisanId || (await uniqueArtisanSlug(name || shopName));
    seller = await Seller.create({
      user: user._id,
      name: shopName,
      description: bio,
      slug,
    });
  } else {
    // Never change an existing slug; Seller keeps the shop name privately
    seller.name = shopName;
    seller.description = bio;
    await seller.save();
  }

  // Upsert public Artisan profile with personal name + shopName and exact same slug
  await Artisan.findOneAndUpdate(
    { slug: seller.slug },
    {
      $set: {
        name,
        shopName,
        craft: craft || 'Handmade Craft',
        region: region || 'India',
        years,
        bio,
        story: storyBody,
        image,
        cover,
      },
      $setOnInsert: { slug: seller.slug },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Create or update linked Story document when storyTitle & storyBody are provided
  if (storyTitle && storyBody) {
    const existingStory = await Story.findOne({ artisanId: seller.slug });
    const storyData = {
      title: storyTitle,
      region: state || region,
      image: cover || image || '/images/covers/saraswati-devi.svg',
      excerpt: storyBody.slice(0, 160),
    };
    if (existingStory) {
      Object.assign(existingStory, storyData);
      await existingStory.save();
    } else {
      await Story.create({
        slug: await uniqueStorySlug(`${seller.slug}-${storyTitle}`),
        artisanId: seller.slug,
        ...storyData,
      });
    }
  }

  const hasRequiredArtisanFields = Boolean(name && shopName && craft && region);
  await User.findByIdAndUpdate(user._id, {
    artisanId: seller.slug,
    onboardingCompleted: hasRequiredArtisanFields,
  });

  return getFullProfile(user._id);
}

/** Overview stats for the logged-in artisan */
async function getOverview(user) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);

  const totalProducts = await Product.countDocuments({ artisanId: seller.slug });
  const relevantStatuses = ['paid', 'processing', 'shipped', 'delivered'];
  const orders = await Order.find({
    status: { $in: relevantStatuses },
    'items.artisanId': seller.slug,
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => ['paid', 'processing'].includes(o.status)).length;

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

/** List products belonging to the logged-in artisan */
async function listProducts(user) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  return Product.find({ artisanId: seller.slug }).sort({ createdAt: -1 });
}

/** Create a new product for the logged-in artisan */
async function createProduct(user, data) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);

  const catSlug = String(data.category || '').toLowerCase();
  if (!(await Category.exists({ slug: catSlug }))) {
    throw new AppError('Unknown category', 400);
  }

  const artisan = await Artisan.findOne({ slug: seller.slug }).lean();
  const baseSlug = slugify(data.name, { lower: true, strict: true }) || 'product';
  let slug = baseSlug;
  let i = 1;
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }

  const gallery = Array.isArray(data.gallery) ? data.gallery.filter(Boolean).slice(0, 4) : [];
  const image = gallery[0] || String(data.image || '').trim();
  const region = String(data.region || artisan?.region || '').trim();

  return Product.create({
    slug,
    name: data.name,
    price: data.price,
    category: catSlug,
    description: data.description || '',
    materials: data.materials || '',
    care: data.care || '',
    origin: data.origin || region,
    region,
    stock: data.stock !== undefined ? Number(data.stock) : 20,
    image,
    gallery,
    artisanId: seller.slug,
  });
}

/** Helper – find owned product by slug (or _id fallback) */
async function findOwnedProduct(artisanSlug, productId) {
  let product = await Product.findOne({ slug: String(productId).toLowerCase(), artisanId: artisanSlug });
  if (!product && mongoose.Types.ObjectId.isValid(productId)) {
    product = await Product.findOne({ _id: productId, artisanId: artisanSlug });
  }
  return product;
}

/** Update a product – only if it belongs to this artisan */
async function updateProduct(user, productId, updateData) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  const product = await findOwnedProduct(seller.slug, productId);
  if (!product) return null;

  if (updateData.category) {
    const catSlug = String(updateData.category).toLowerCase();
    if (!(await Category.exists({ slug: catSlug }))) {
      throw new AppError('Unknown category', 400);
    }
    product.category = catSlug;
  }

  const fields = ['name', 'price', 'description', 'materials', 'care', 'region', 'origin', 'stock'];
  for (const key of fields) {
    if (updateData[key] !== undefined) product[key] = updateData[key];
  }

  if (Array.isArray(updateData.gallery)) {
    product.gallery = updateData.gallery.filter(Boolean).slice(0, 4);
    product.image = product.gallery[0] || updateData.image || '';
  } else if (updateData.image !== undefined) {
    product.image = updateData.image;
  }

  await product.save();
  return product;
}

/** Delete a product – only if it belongs to this artisan */
async function deleteProduct(user, productId) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  const product = await findOwnedProduct(seller.slug, productId);
  if (!product) return null;
  await product.deleteOne();
  return product;
}

/** Save delivery API key for artisan */
async function saveDelivery(user, apiKey) {
  const seller = await Seller.findOne({ user: user._id });
  if (!seller) throw new AppError('Seller profile not found', 404);
  seller.deliveryApiKey = apiKey;
  await seller.save();
  return { apiKey };
}

/** Get delivery API key */
async function getDelivery(user) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  return { apiKey: seller.deliveryApiKey || '' };
}

/** Stub sales endpoint */
async function getSales() {
  return { totalRevenue: 0, totalOrders: 0, recent: [] };
}

/** Voice onboarding placeholder */
async function voiceOnboard() {
  return { transcription: 'Sample transcription from Bhashini API' };
}

/** List paid/active orders received – only those belonging to this artisan */
async function listOrders(user) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  const orders = await Order.find({
    'items.artisanId': seller.slug,
    status: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
  }).sort({ createdAt: -1 });

  return orders.map((order) => {
    const filteredItems = order.items.filter((item) => item.artisanId === seller.slug);
    const { payment, ...rest } = order.toObject();
    return { ...rest, items: filteredItems };
  });
}

/** Update order status – enforce allowed transitions */
async function updateOrderStatus(user, orderId, newStatus) {
  const seller = await getSellerForUser(user._id);
  if (!seller) throw new AppError('Seller profile not found', 404);
  const order = await Order.findOne({ _id: orderId, 'items.artisanId': seller.slug });
  if (!order) return null;

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
  order.statusHistory.push({ status: newStatus });
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
  listOrders,
  updateOrderStatus,
  getSellerForUser,
  getFullProfile,
};
