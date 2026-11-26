// Seller controller – thin wrappers around seller.service functions, all async and using AppError for errors
const { sendSuccess, sendError } = require('../../utils/response');
const sellerService = require('./seller.service');
const AppError = require('../../utils/AppError');
const { getPublicUrl } = require('../../utils/upload');

/** POST /api/seller/upload */
exports.uploadImage = async (req, res) => {
  if (!req.file) {
    throw new AppError('Image file is required', 400);
  }
  const url = getPublicUrl(req.file.filename);
  sendSuccess(res, { url }, 'Image uploaded', 201);
};

/** POST /api/seller/onboard */
exports.onboard = async (req, res) => {
  try {
    const seller = await sellerService.onboard(req.user, req.body);
    sendSuccess(res, seller, 'Seller onboarded', 201);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** GET /api/seller/me */
exports.getProfile = async (req, res) => {
  try {
    const profile = await sellerService.getFullProfile(req.user._id);
    if (!profile) throw new AppError('Seller profile not found', 404);
    sendSuccess(res, profile);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** GET /api/seller/overview */
exports.overview = async (req, res) => {
  try {
    const data = await sellerService.getOverview(req.user);
    sendSuccess(res, data);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** GET /api/seller/products */
exports.listProducts = async (req, res) => {
  try {
    const products = await sellerService.listProducts(req.user);
    sendSuccess(res, products);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** POST /api/seller/products */
exports.createProduct = async (req, res) => {
  try {
    const product = await sellerService.createProduct(req.user, req.body);
    sendSuccess(res, product, 'Product created', 201);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** PUT /api/seller/products/:id */
exports.updateProduct = async (req, res) => {
  try {
    const product = await sellerService.updateProduct(req.user, req.params.id, req.body);
    if (!product) throw new AppError('Product not found', 404);
    sendSuccess(res, product);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** DELETE /api/seller/products/:id */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await sellerService.deleteProduct(req.user, req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    sendSuccess(res, product);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** POST /api/seller/delivery */
exports.saveDelivery = async (req, res) => {
  try {
    const data = await sellerService.saveDelivery(req.user, req.body.apiKey);
    sendSuccess(res, data);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** GET /api/seller/delivery */
exports.getDelivery = async (req, res) => {
  try {
    const data = await sellerService.getDelivery(req.user);
    sendSuccess(res, data);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** GET /api/seller/sales */
exports.getSales = async (req, res) => {
  try {
    const data = await sellerService.getSales(req.user);
    sendSuccess(res, data);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** POST /api/seller/onboard/voice */
exports.voiceOnboard = async (req, res) => {
  try {
    const data = await sellerService.voiceOnboard();
    sendSuccess(res, data);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** GET /api/seller/orders */
exports.listOrders = async (req, res) => {
  try {
    const orders = await sellerService.listOrders(req.user);
    sendSuccess(res, orders);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};

/** PATCH /api/seller/orders/:id/status */
exports.updateOrderStatus = async (req, res) => {
  try {
    const updated = await sellerService.updateOrderStatus(
      req.user,
      req.params.id,
      req.body.status
    );
    if (!updated) throw new AppError('Order not found', 404);
    sendSuccess(res, updated);
  } catch (err) {
    const status = err.statusCode || 400;
    sendError(res, err.message, status);
  }
};
