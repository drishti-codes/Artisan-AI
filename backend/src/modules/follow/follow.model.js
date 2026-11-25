const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artisanId: { type: String, required: true, lowercase: true, trim: true }, // artisan slug
  },
  { timestamps: true }
);
followSchema.index({ user: 1, artisanId: 1 }, { unique: true }); // one follow per user per artisan

module.exports = mongoose.model('Follow', followSchema);
