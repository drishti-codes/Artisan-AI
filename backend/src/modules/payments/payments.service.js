const crypto = require('crypto');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const Cart = require('../cart/cart.model');
const AppError = require('../../utils/AppError');

const mode = () => (process.env.PAYMENT_MODE === 'razorpay' ? 'razorpay' : 'mock');

async function getPendingOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'pending_payment') throw new AppError('This order is already paid or closed', 409);
  return order;
}

// Razorpay signature = HMAC-SHA256 of "razorpayOrderId|razorpayPaymentId" with our secret key
function isValidSignature(razorpayOrderId, razorpayPaymentId, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Reduces stock, marks the order paid and clears the cart. Safe to call twice.
async function markOrderPaid(order, paymentInfo = {}) {
  if (order.status !== 'pending_payment') return order;

  const done = [];
  for (const item of order.items) {
    // Atomic: only reduces stock if enough stock is still there
    const result = await Product.updateOne(
      { slug: item.productId, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty, soldCount: item.qty } }
    );
    if (result.modifiedCount !== 1) {
      for (const d of done) await Product.updateOne({ slug: d.productId }, { $inc: { stock: d.qty, soldCount: -d.qty } }); // undo
      throw new AppError(`Not enough stock for ${item.name}`, 409);
    }
    done.push(item);
  }

  order.status = 'paid';
  order.statusHistory.push({ status: 'paid' });
  order.payment = { ...paymentInfo, paidAt: new Date() };
  await order.save();
  await Cart.updateOne({ user: order.user }, { $set: { items: [] } });
  return order;
}

async function createPayment(userId, orderId) {
  const order = await getPendingOrder(userId, orderId);

  if (mode() === 'mock') {
    return { mode: 'mock', orderId: order._id.toString(), amount: order.total, currency: 'INR' };
  }

  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new AppError('Razorpay keys are missing in .env', 500);
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

  // The amount comes from OUR order total, not from the frontend
  const rpOrder = await razorpay.orders.create({ amount: Math.round(order.total * 100), currency: 'INR', receipt: order.orderNumber });
  order.payment = { provider: 'razorpay', razorpayOrderId: rpOrder.id };
  await order.save();
  return { mode: 'razorpay', keyId: RAZORPAY_KEY_ID, razorpayOrderId: rpOrder.id, amount: order.total, currency: 'INR', orderId: order._id.toString() };
}

async function verifyPayment(userId, { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (mode() !== 'razorpay') throw new AppError('Razorpay mode is not enabled', 400);
  const order = await getPendingOrder(userId, orderId);
  if (!order.payment || order.payment.razorpayOrderId !== razorpay_order_id) throw new AppError('Payment does not match this order', 400);
  if (!isValidSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) {
    throw new AppError('Payment verification failed', 400);
  }
  return markOrderPaid(order, { provider: 'razorpay', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id });
}

// DEMO ONLY: marks the order paid without a real payment. Works only when PAYMENT_MODE=mock.
async function mockConfirm(userId, orderId) {
  if (mode() !== 'mock') throw new AppError('Mock payment is disabled', 403);
  const order = await getPendingOrder(userId, orderId);
  return markOrderPaid(order, { provider: 'mock' });
}

module.exports = { createPayment, verifyPayment, mockConfirm, markOrderPaid, isValidSignature };
