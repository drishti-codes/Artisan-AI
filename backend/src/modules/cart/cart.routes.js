const express = require('express');
const { body } = require('express-validator');
const service = require('./cart.service');
const protect = require('../../middleware/protect');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();
router.use(protect); // every cart route needs login

const qtyRule = body('qty').isInt({ min: 1, max: 10 }).withMessage('qty must be between 1 and 10').toInt();

router.get('/', asyncHandler(async (req, res) => sendSuccess(res, await service.getCart(req.user._id))));
router.post('/items', [body('productId').trim().notEmpty().withMessage('productId required'), qtyRule], validate,
  asyncHandler(async (req, res) => sendSuccess(res, await service.addItem(req.user._id, req.body.productId, req.body.qty), 'Added to cart')));
router.post('/merge', [body('items').isArray({ max: 50 }).withMessage('items must be a list'), body('items.*.id').notEmpty().withMessage('item id required'), body('items.*.qty').isInt({ min: 1, max: 10 }).withMessage('item qty must be 1 to 10').toInt()], validate,
  asyncHandler(async (req, res) => sendSuccess(res, await service.mergeCart(req.user._id, req.body.items), 'Cart merged')));
router.patch('/items/:productId', [qtyRule], validate,
  asyncHandler(async (req, res) => sendSuccess(res, await service.updateItem(req.user._id, req.params.productId, req.body.qty), 'Cart updated')));
router.delete('/items/:productId', asyncHandler(async (req, res) => sendSuccess(res, await service.removeItem(req.user._id, req.params.productId), 'Removed from cart')));
router.delete('/', asyncHandler(async (req, res) => sendSuccess(res, await service.clearCart(req.user._id), 'Cart cleared')));

module.exports = router;
