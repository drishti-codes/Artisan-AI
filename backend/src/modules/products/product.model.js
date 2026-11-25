const mongoose = require('mongoose');
const toClientJSON = require('../../utils/toClientJSON');

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true }, // returned as "id"
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, lowercase: true, index: true }, // category slug
    artisanId: { type: String, required: true, trim: true, lowercase: true, index: true }, // artisan slug
    price: { type: Number, required: true, min: 0 }, // INR
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    region: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
    gallery: { type: [String], default: [] },
    description: { type: String, default: '' },
    materials: { type: String, default: '' },
    origin: { type: String, default: '' },
    care: { type: String, default: '' },
    // Extra fields for later modules
    stock: { type: Number, default: 20, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Used by search in the products module
productSchema.index({ name: 'text', description: 'text', materials: 'text', region: 'text' });

productSchema.plugin(toClientJSON);

module.exports = mongoose.model('Product', productSchema);
