const Order = require('./order.model');
const cartService = require('../cart/cart.service');
const AppError = require('../../utils/AppError');

const SHIPPING = 200; // flat shipping in INR

async function makeOrderNumber() {
  const d = new Date();
  const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  for (let i = 0; i < 5; i++) {
    const number = `ART-${day}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await Order.exists({ orderNumber: number }))) return number;
  }
  return `ART-${day}-${Date.now()}`;
}

// Builds the order from the user's saved cart. All prices come from the database, never from the client.
async function createOrder(user, { address, paymentMethod }) {
  const cart = await cartService.getCart(user._id);
  if (!cart.items.length) throw new AppError('Your cart is empty', 400);

  for (const item of cart.items) {
    if (item.qty > item.stock) throw new AppError(`Only ${item.stock} left in stock for ${item.name}`, 409);
  }

  const items = cart.items.map(({ id, name, price, image, artisanId, qty }) => ({ productId: id, name, price, image, artisanId, qty }));
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return Order.create({
    user: user._id,
    orderNumber: await makeOrderNumber(),
    items,
    address,
    paymentMethod,
    status: 'pending_payment',
    statusHistory: [{ status: 'pending_payment' }],
    subtotal,
    shipping: SHIPPING,
    total: subtotal + SHIPPING,
  });
}

const listMyOrders = (userId) => Order.find({ user: userId }).sort({ createdAt: -1 });

async function getMyOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found', 404);
  return order;
}

// ---------- seller side ----------
function sellerView(order, artisanId) {
  const items = order.items.filter((i) => i.artisanId === artisanId);
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    address: order.address,
    items,
    sellerTotal: items.reduce((sum, i) => sum + i.price * i.qty, 0),
  };
}

async function listSellerOrders(artisanId) {
  const orders = await Order.find({ 'items.artisanId': artisanId, status: { $ne: 'pending_payment' } }).sort({ createdAt: -1 });
  return orders.map((o) => sellerView(o, artisanId));
}

async function updateSellerOrderStatus(artisanId, orderId, status) {
  const order = await Order.findOne({ _id: orderId, 'items.artisanId': artisanId });
  if (!order) throw new AppError('Order not found', 404);
  if (['pending_payment', 'cancelled'].includes(order.status)) throw new AppError(`Cannot update an order that is ${order.status}`, 409);
  order.status = status;
  order.statusHistory.push({ status });
  await order.save();
  return sellerView(order, artisanId);
}

module.exports = { createOrder, listMyOrders, getMyOrder, listSellerOrders, updateSellerOrderStatus, SHIPPING };
