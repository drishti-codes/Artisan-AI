const mongoose = require('mongoose');
const toClientJSON = require('../../utils/toClientJSON');

const storySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true }, // returned as "id"
    title: { type: String, required: true, trim: true },
    artisanId: { type: String, required: true, trim: true, lowercase: true, index: true }, // artisan slug
    region: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
    excerpt: { type: String, default: '' },
  },
  { timestamps: true }
);

storySchema.plugin(toClientJSON);

module.exports = mongoose.model('Story', storySchema);
