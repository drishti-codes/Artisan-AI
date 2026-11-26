require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const mongoose = require('mongoose');
const Seller = require('../src/modules/seller/seller.model');
const Artisan = require('../src/modules/artisans/artisan.model');
const User = require('../src/modules/auth/user.model');

const dryRun = process.argv.includes('--dry-run');

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI / MONGODB_URI is missing in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
  if (dryRun) console.log('Running in --dry-run mode (no writes will be made)');

  const sellers = await Seller.find().lean();
  let updatedCount = 0;

  for (const seller of sellers) {
    const artisan = await Artisan.findOne({ slug: seller.slug });
    if (!artisan || artisan.shopName) continue; // skip if missing or already has shopName

    const user = await User.findById(seller.user).lean();
    const personalName = (user && user.name) ? user.name.trim() : artisan.name;
    const shopName = artisan.name;

    updatedCount++;
    console.log(`[Update] slug=${seller.slug}: name "${artisan.name}" -> "${personalName}", shopName -> "${shopName}"`);

    if (!dryRun) {
      artisan.shopName = shopName;
      artisan.name = personalName;
      await artisan.save();
    }
  }

  console.log(`Done. Artisans updated: ${updatedCount}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Backfill failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
