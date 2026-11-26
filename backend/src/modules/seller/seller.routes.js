const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../../utils/asyncHandler');
const protect = require('../../middleware/protect');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { uploadImage } = require('../../utils/upload');

const sellerController = require('./seller.controller');

const router = express.Router();

// ---------- Image upload ----------
router.post(
  '/upload',
  protect,
  authorize('artisan', 'admin'),
  uploadImage.single('image'),
  asyncHandler(sellerController.uploadImage)
);

// ---------- Seller onboarding & profile ----------
router.post(
  '/onboard',
  protect,
  authorize('artisan', 'admin'),
  [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
    body('shopName').trim().isLength({ min: 2, max: 80 }).withMessage('Shop name must be 2 to 80 characters'),
    body('craft').trim().notEmpty().withMessage('Craft/category is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('years').optional().isInt({ min: 0 }).withMessage('Years must be 0 or more'),
    body('bio').optional().isString(),
    body('description').optional().isString(),
    body('image').optional().isString().custom((val) => {
      if (!val) return true;
      const prefix = `${(process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '')}/uploads/`;
      if (!val.startsWith(prefix)) throw new Error('Profile photo URL must come from /api/seller/upload');
      return true;
    }),
    body('cover').optional().isString().custom((val) => {
      if (!val) return true;
      const prefix = `${(process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '')}/uploads/`;
      if (!val.startsWith(prefix)) throw new Error('Cover photo URL must come from /api/seller/upload');
      return true;
    }),
    body('storyTitle').optional().isString(),
    body('storyBody').optional().isString(),
  ],
  validate,
  asyncHandler(sellerController.onboard)
);

// ---------- Profile ----------
router.get('/me', protect, authorize('artisan', 'admin'), asyncHandler(sellerController.getProfile));

// ---------- Product CRUD ----------
router.get('/products', protect, authorize('artisan', 'admin'), asyncHandler(sellerController.listProducts));
router.post(
  '/products',
  protect,
  authorize('artisan', 'admin'),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name required'),
    body('price').isFloat({ min: 1 }).withMessage('Valid price required'),
    body('category').trim().notEmpty().withMessage('Category required'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
    body('region').optional().isString(),
    body('description').optional().isString(),
    body('materials').optional().isString(),
    body('care').optional().isString(),
    body('image').optional().isString(),
    body('gallery').optional().isArray({ max: 4 }).withMessage('Up to 4 images allowed'),
  ],
  validate,
  asyncHandler(sellerController.createProduct)
);
router.put(
  '/products/:id',
  protect,
  authorize('artisan', 'admin'),
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('price').optional().isFloat({ min: 1 }),
    body('category').optional().trim(),
    body('stock').optional().isInt({ min: 0 }),
    body('region').optional().isString(),
    body('description').optional().isString(),
    body('materials').optional().isString(),
    body('care').optional().isString(),
    body('image').optional().isString(),
    body('gallery').optional().isArray({ max: 4 }).withMessage('Up to 4 images allowed'),
  ],
  validate,
  asyncHandler(sellerController.updateProduct)
);
router.delete('/products/:id', protect, authorize('artisan', 'admin'), asyncHandler(sellerController.deleteProduct));

// ---------- Delivery partner ----------
router.post(
  '/delivery',
  protect,
  authorize('artisan', 'admin'),
  [body('apiKey').trim().notEmpty().withMessage('API key required')],
  validate,
  asyncHandler(sellerController.saveDelivery)
);
router.get('/delivery', protect, authorize('artisan', 'admin'), asyncHandler(sellerController.getDelivery));

// ---------- Voice onboarding ----------
router.post('/onboard/voice', protect, authorize('artisan', 'admin'), asyncHandler(sellerController.voiceOnboard));

// ---------- Sales ----------
router.get('/sales', protect, authorize('artisan', 'admin'), asyncHandler(sellerController.getSales));

// ---------- Overview and order routes ----------
router.get('/overview', protect, authorize('artisan', 'admin'), asyncHandler(sellerController.overview));
router.get('/orders', protect, authorize('artisan', 'admin'), asyncHandler(sellerController.listOrders));
router.patch(
  '/orders/:id/status',
  protect,
  authorize('artisan', 'admin'),
  [
    body('status').isIn(['processing', 'shipped', 'delivered']).withMessage('Invalid status'),
  ],
  validate,
  asyncHandler(sellerController.updateOrderStatus)
);

module.exports = router;
