const express = require('express');
const { body } = require('express-validator');
const service = require('./orders.service');
const protect = require('../../middleware/protect');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();
router.use(protect);

const createRules = [
  body('address.name').trim().notEmpty().withMessage('name is required'),
  body('address.line1').trim().notEmpty().withMessage('address is required'),
  body('address.city').trim().notEmpty().withMessage('city is required'),
  body('address.pincode').trim().matches(/^\d{6}$/).withMessage('pincode must be 6 digits'),
  body('address.phone').trim().matches(/^[0-9+\-\s]{10,15}$/).withMessage('phone must be 10 to 15 digits'),
  body('paymentMethod').isIn(['upi', 'card', 'netbanking', 'wallet']).withMessage('paymentMethod must be upi, card, netbanking or wallet'),
];

router.post('/', createRules, validate, asyncHandler(async (req, res) => sendSuccess(res, await service.createOrder(req.user, req.body), 'Order created', 201)));
router.get('/', asyncHandler(async (req, res) => sendSuccess(res, await service.listMyOrders(req.user._id))));
router.get('/:id', asyncHandler(async (req, res) => sendSuccess(res, await service.getMyOrder(req.user._id, req.params.id))));

module.exports = router;
