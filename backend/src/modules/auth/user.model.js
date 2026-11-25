const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false }, // never returned by default
    role: { type: String, enum: ['customer', 'artisan', 'admin'], default: 'customer' },
    artisanId: { type: String, default: null, trim: true, lowercase: true }, // links artisan user to artisan profile (slug)
    onboardingCompleted: { type: Boolean, default: false }, // new field
  },
  { timestamps: true }
);

// Hash password before saving (only when changed)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
