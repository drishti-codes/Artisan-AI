const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    // Snapshot of the products at the time of the order (prices come from our database)
    items: [
      {
        _id: false,
        productId: String,
        name: String,
        price: Number,
        image: String,
        artisanId: String,
        qty: Number,
      },
    ],
    address: {
      name: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet'], required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending_payment',
    },
    statusHistory: [{ _id: false, status: String, at: { type: Date, default: Date.now } }],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    payment: {
      provider: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      paidAt: Date,
    },
  },
  { timestamps: true }
);

orderSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Order', orderSchema);
