const mongoose = require('mongoose');
const toClientJSON = require('../../utils/toClientJSON');

const artisanSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true }, // returned as "id"
    name: { type: String, required: true, trim: true }, // personal name
    shopName: { type: String, default: '', trim: true, maxlength: 80 },
    craft: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    years: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '' },
    cover: { type: String, default: '' },
    bio: { type: String, default: '' },
    story: { type: String, default: '' },
    process: { type: String, default: '' },
    followersCount: { type: Number, default: 0, min: 0 }, // used later by follow/unfollow
  },
  { timestamps: true }
);

artisanSchema.plugin(toClientJSON);

module.exports = mongoose.model('Artisan', artisanSchema);
