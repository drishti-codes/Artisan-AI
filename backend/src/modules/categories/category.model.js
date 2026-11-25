const mongoose = require('mongoose');
const toClientJSON = require('../../utils/toClientJSON');

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

// Frontend uses category.slug, so we keep "slug" in the response
categorySchema.plugin(toClientJSON, { keepSlug: true });

module.exports = mongoose.model('Category', categorySchema);
