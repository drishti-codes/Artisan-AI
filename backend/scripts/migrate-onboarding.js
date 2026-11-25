// migrations script to set onboardingCompleted flag for artisans that already have a seller profile or an artisan profile
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config(); // expects .env with MONGO_URI

const mongoose = require('mongoose');
const User = require('../modules/auth/user.model');
const Seller = require('../modules/seller/seller.model');
const Artisan = require('../modules/artisans/artisan.model'); // plural folder name "artisans"

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }

  // Connect without deprecated options
  await mongoose.connect(process.env.MONGO_URI);

  // Find all users that are artisans and have a non‑null artisanId (slug reference)
  const users = await User.find({ role: 'artisan', artisanId: { $ne: null } });
  const toUpdate = [];

  for (const u of users) {
    if (u.onboardingCompleted) continue; // already true → idempotent
    // A profile exists if either a Seller or an Artisan document matches the slug
    const hasSeller = await Seller.findOne({ slug: u.artisanId });
    const hasArtisan = await Artisan.findOne({ slug: u.artisanId });
    if (hasSeller || hasArtisan) {
      toUpdate.push(u._id);
    }
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would set onboardingCompleted for ${toUpdate.length} artisan user(s).`);
    await mongoose.disconnect();
    return;
  }

  const result = await User.updateMany(
    { _id: { $in: toUpdate } },
    { $set: { onboardingCompleted: true } }
  );
  console.log(`Updated onboardingCompleted for ${result.modifiedCount} artisan user(s).`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
