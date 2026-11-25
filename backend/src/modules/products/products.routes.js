const express = require('express');
const { body } = require('express-validator');
const service = require('./products.service');
const protect = require('../../middleware/protect');
const restrictTo = require('../../middleware/restrictTo');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();

// Public
router.get('/', asyncHandler(async (req, res) => sendSuccess(res, await service.listProducts(req.query))));
router.get('/:id/related', asyncHandler(async (req, res) => sendSuccess(res, await service.getRelated(req.params.id))));
router.get('/:id', asyncHandler(async (req, res) => sendSuccess(res, await service.getProduct(req.params.id))));

// Artisan only
const createRules = [
  body('name').trim().isLength({ min: 3 }).withMessage('name is required (min 3 characters)'),
  body('category').trim().notEmpty().withMessage('category is required'),
  body('price').isFloat({ min: 1 }).withMessage('price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('stock must be 0 or more'),
  body('gallery').optional().isArray().withMessage('gallery must be a list of image URLs'),
];
const updateRules = [
  body('price').optional().isFloat({ min: 1 }).withMessage('price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('stock must be 0 or more'),
  body('gallery').optional().isArray().withMessage('gallery must be a list of image URLs'),
];

router.post('/', protect, restrictTo('artisan'), createRules, validate, asyncHandler(async (req, res) => sendSuccess(res, await service.createProduct(req.user, req.body), 'Product created', 201)));
router.patch('/:id', protect, restrictTo('artisan', 'admin'), updateRules, validate, asyncHandler(async (req, res) => sendSuccess(res, await service.updateProduct(req.user, req.params.id, req.body), 'Product updated')));
router.delete('/:id', protect, restrictTo('artisan', 'admin'), asyncHandler(async (req, res) => sendSuccess(res, await service.deleteProduct(req.user, req.params.id), 'Product removed')));

module.exports = router;
