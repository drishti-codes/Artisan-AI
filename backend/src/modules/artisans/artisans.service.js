const Artisan = require('./artisan.model');
const Product = require('../products/product.model');
const Follow = require('../follow/follow.model');
const AppError = require('../../utils/AppError');

async function getArtisanOrFail(slug) {
  const artisan = await Artisan.findOne({ slug: String(slug).toLowerCase() });
  if (!artisan) throw new AppError('Artisan not found', 404);
  return artisan;
}

const listArtisans = () => Artisan.find().sort({ _id: 1 });
const getArtisan = (slug) => getArtisanOrFail(slug);

async function getArtisanProducts(slug) {
  const artisan = await getArtisanOrFail(slug);
  return Product.find({ artisanId: artisan.slug, isActive: true }).sort({ _id: 1 });
}

// Follow if not following, unfollow if already following.
async function toggleFollow(userId, slug) {
  const artisan = await getArtisanOrFail(slug);
  const existing = await Follow.findOne({ user: userId, artisanId: artisan.slug });
  let following;
  if (existing) {
    await existing.deleteOne();
    following = false;
  } else {
    await Follow.create({ user: userId, artisanId: artisan.slug });
    following = true;
  }
  artisan.followersCount = await Follow.countDocuments({ artisanId: artisan.slug });
  await artisan.save();
  return { following, followersCount: artisan.followersCount };
}

// Does this user already follow the artisan?
async function getFollowStatus(userId, slug) {
  const artisan = await getArtisanOrFail(slug);
  const existing = await Follow.exists({ user: userId, artisanId: artisan.slug });
  return { following: Boolean(existing), followersCount: artisan.followersCount };
}

module.exports = { listArtisans, getArtisan, getArtisanProducts, toggleFollow, getFollowStatus };
