const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  slug: { type: String, unique: true, required: true },
  deliveryApiKey: { type: String, default: '' }, // simple storage for delivery partner key
}, { timestamps: true });

module.exports = mongoose.model('Seller', sellerSchema);