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
  let createdArtisans = 0;

  for (const seller of sellers) {
    const existing = await Artisan.findOne({ slug: seller.slug }).lean();
    if (!existing) {
      createdArtisans++;
      console.log(`[Artisan missing] ${seller.slug} (${seller.name})`);
      if (!dryRun) {
        const user = await User.findById(seller.user).lean();
        const personalName = (user && user.name) ? user.name.trim() : seller.name;
        await Artisan.create({
          slug: seller.slug,
          name: personalName,
          shopName: seller.name,
          craft: 'Handmade Craft',
          region: 'India',
          years: 1,
          image: '',
          cover: '',
          bio: seller.description || 'Handmade crafts from our studio.',
        });
        await User.updateOne(
          { _id: seller.user },
          { $set: { artisanId: seller.slug, onboardingCompleted: true } }
        );
      }
    }
  }

  console.log(`Summary: artisans created=${createdArtisans}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Backfill failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
