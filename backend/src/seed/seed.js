// Seed script: loads categories, artisans, products and stories into MongoDB,
// and creates demo login accounts (one per artisan + one admin).
// Run with:  npm run seed
// Safe to run again: it clears the catalog data and the demo accounts first.

require('dns').setServers(['8.8.8.8', '1.1.1.1']); // same DNS fix as server.js
require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('../modules/categories/category.model');
const Artisan = require('../modules/artisans/artisan.model');
const Product = require('../modules/products/product.model');
const Story = require('../modules/stories/story.model');
const User = require('../modules/auth/user.model');

const categoriesData = require('../../seed/categories.json');
const artisansData = require('../../seed/artisans.json');
const productsData = require('../../seed/products.json');
const storiesData = require('../../seed/stories.json');

const DEMO_DOMAIN = '@artisanai.demo';

// The frontend data uses "id" as the slug, so we store it in "slug"
function idToSlug(item) {
  const { id, ...rest } = item;
  return { slug: id, ...rest };
}

async function seed() {
  // -------- Safety checks --------
  // Ensure required passwords are present in .env
  const artisanPassword = process.env.SEED_ARTISAN_PASSWORD;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!artisanPassword) {
    console.error('Error: SEED_ARTISAN_PASSWORD is missing or empty in .env');
    process.exit(1);
  }
  if (!adminPassword) {
    console.error('Error: SEED_ADMIN_PASSWORD is missing or empty in .env');
    process.exit(1);
  }

  // Ensure the reset flag is explicitly allowed
  const allowReset = process.env.SEED_ALLOW_RESET;
  if (allowReset !== 'true') {
    console.error('Error: SEED_ALLOW_RESET is not set to "true". Refusing to delete existing data.');
    process.exit(1);
  }

  // -------- Database connection --------
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing. Add it to your .env file.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

  // 1. Clear old data (only runs if SEED_ALLOW_RESET==="true")
  await Promise.all([
    Category.deleteMany({}),
    Artisan.deleteMany({}),
    Product.deleteMany({}),
    Story.deleteMany({}),
    User.deleteMany({ email: { $regex: `${DEMO_DOMAIN.replace('.', '\\.')}$` } }),
  ]);
  console.log('Old catalog data and demo accounts cleared');

  // 2. Insert catalog data
  await Category.insertMany(categoriesData); // categories already use "slug"
  await Artisan.insertMany(artisansData.map(idToSlug));
  await Product.insertMany(productsData.map(idToSlug));
  await Story.insertMany(storiesData.map(idToSlug));

  // 3. Create demo users (create() runs the password hashing)
  for (const artisan of artisansData) {
    await User.create({
      name: artisan.name,
      email: `${artisan.id}${DEMO_DOMAIN}`,
      password: artisanPassword,
      role: 'artisan',
      artisanId: artisan.id,
    });
  }
  await User.create({
    name: 'ArtisanAI Admin',
    email: `admin${DEMO_DOMAIN}`,
    password: adminPassword,
    role: 'admin',
  });

  console.log('\nSeed finished:');
  console.log(`  Categories : ${await Category.countDocuments()}`);
  console.log(`  Artisans   : ${await Artisan.countDocuments()}`);
  console.log(`  Products   : ${await Product.countDocuments()}`);
  console.log(`  Stories    : ${await Story.countDocuments()}`);
  console.log(`  Users      : ${await User.countDocuments()} (4 artisans + 1 admin)`);

  console.log('\nDemo logins (password comes from your .env):');
  artisansData.forEach((a) => console.log(`  artisan: ${a.id}${DEMO_DOMAIN}`));
  console.log(`  admin  : admin${DEMO_DOMAIN}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
