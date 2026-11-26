require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const mongoose = require('mongoose');
const Seller = require('../src/modules/seller/seller.model');
const Product = require('../src/modules/products/product.model');

const SARASWATI_SVG = '/images/artisans/saraswati-devi.svg';
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

  const sellerSlugs = await Seller.distinct('slug');
  if (sellerSlugs.length === 0) {
    console.log('No sellers found. Nothing to update.');
    await mongoose.disconnect();
    return;
  }

  const filter = {
    artisanId: { $in: sellerSlugs },
    image: SARASWATI_SVG,
  };

  const count = await Product.countDocuments(filter);
  console.log(`Products with Saraswati placeholder image: ${count}`);

  if (count > 0 && !dryRun) {
    const result = await Product.updateMany(filter, {
      $set: { image: '', gallery: [] },
    });
    console.log(`Cleared image/gallery on ${result.modifiedCount} product(s).`);
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Script failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
