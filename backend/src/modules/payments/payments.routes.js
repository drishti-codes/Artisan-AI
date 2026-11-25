const express = require('express');
const { body } = require('express-validator');
const service = require('./payments.service');
const protect = require('../../middleware/protect');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();
router.use(protect);

const orderIdRule = body('orderId').trim().notEmpty().withMessage('orderId required');

router.post('/create-order', [orderIdRule], validate, asyncHandler(async (req, res) => sendSuccess(res, await service.createPayment(req.user._id, req.body.orderId))));
router.post('/verify', [orderIdRule, body('razorpay_order_id').notEmpty(), body('razorpay_payment_id').notEmpty(), body('razorpay_signature').notEmpty()], validate,
  asyncHandler(async (req, res) => sendSuccess(res, await service.verifyPayment(req.user._id, req.body), 'Payment verified')));
// DEMO ONLY
router.post('/mock-confirm', [orderIdRule], validate, asyncHandler(async (req, res) => sendSuccess(res, await service.mockConfirm(req.user._id, req.body.orderId), 'Payment confirmed (demo mode)')));

module.exports = router;
