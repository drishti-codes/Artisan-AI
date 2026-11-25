const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../../utils/asyncHandler');
const protect = require('../../middleware/protect');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const sellerController = require('./seller.controller');

const router = express.Router();

// ---------- Seller onboarding ----------
router.post(
  '/onboard',
  protect,
  authorize('artisan','admin'),
  [
    body('shopName').trim().isLength({ min: 2 }).withMessage('Shop name required'),
    body('description').optional().isString(),
  ],
  validate,
  asyncHandler(sellerController.onboard)
);

// ---------- Profile ----------
router.get('/me', protect, authorize('artisan','admin'), asyncHandler(sellerController.getProfile));

// ---------- Product CRUD ----------
router.get('/products', protect, authorize('artisan','admin'), asyncHandler(sellerController.listProducts));
router.post(
  '/products',
  protect,
  authorize('artisan','admin'),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('category').trim().notEmpty().withMessage('Category required'),
    body('description').optional().isString(),
  ],
  validate,
  asyncHandler(sellerController.createProduct)
);
router.put(
  '/products/:id',
  protect,
  authorize('artisan','admin'),
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('price').optional().isFloat({ min: 0 }),
    body('category').optional().trim(),
    body('description').optional().isString(),
  ],
  validate,
  asyncHandler(sellerController.updateProduct)
);
router.delete('/products/:id', protect, asyncHandler(sellerController.deleteProduct));

// ---------- Delivery partner ----------
router.post(
  '/delivery',
  protect,
  authorize('artisan','admin'),
  [body('apiKey').trim().notEmpty().withMessage('API key required')],
  validate,
  asyncHandler(sellerController.saveDelivery)
);
router.get('/delivery', protect, asyncHandler(sellerController.getDelivery));

// ---------- Voice onboarding ----------
router.post('/onboard/voice', protect, asyncHandler(sellerController.voiceOnboard));

// ---------- Sales ----------
router.get('/sales', protect, asyncHandler(sellerController.getSales));

// ---------- New seller overview and order routes ----------
router.get('/overview', protect, authorize('artisan','admin'), asyncHandler(sellerController.overview));
router.get('/orders', protect, authorize('artisan','admin'), asyncHandler(sellerController.listOrders));
router.patch(
  '/orders/:id/status',
  protect,
  authorize('artisan','admin'),
  [
    body('status').isIn(['processing','shipped','delivered']).withMessage('Invalid status'),
  ],
  validate,
  asyncHandler(sellerController.updateOrderStatus)
);

module.exports = router;
