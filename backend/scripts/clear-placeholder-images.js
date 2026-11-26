require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const mongoose = require('mongoose');
const Seller = require('../src/modules/seller/seller.model');
const Artisan = require('../src/modules/artisans/artisan.model');

const PLACEHOLDER_IMAGE = '/images/artisans/saraswati-devi.svg';
const PLACEHOLDER_COVER = '/images/covers/saraswati-devi.svg';

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
  let clearedCount = 0;

  for (const seller of sellers) {
    const artisan = await Artisan.findOne({ slug: seller.slug });
    if (!artisan) continue;

    const hasPlaceholderImage = artisan.image === PLACEHOLDER_IMAGE;
    const hasPlaceholderCover = artisan.cover === PLACEHOLDER_COVER;
    if (!hasPlaceholderImage && !hasPlaceholderCover) continue;

    clearedCount++;
    console.log(
      `[Clear placeholder] slug=${seller.slug} (image=${hasPlaceholderImage ? 'cleared' : 'kept'}, cover=${hasPlaceholderCover ? 'cleared' : 'kept'})`
    );

    if (!dryRun) {
      if (hasPlaceholderImage) artisan.image = '';
      if (hasPlaceholderCover) artisan.cover = '';
      await artisan.save();
    }
  }

  console.log(`Done. Artisans updated: ${clearedCount}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Script failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
