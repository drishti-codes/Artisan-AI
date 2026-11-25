const express = require('express');
const { body } = require('express-validator');
const authService = require('./auth.service');
const protect = require('../../middleware/protect');
const validate = require('../../middleware/validate');
const authRateLimiter = require('../../middleware/authRateLimiter');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();

router.post(
  '/register',
  authRateLimiter,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('name must be at least 2 characters'),
    body('email').isEmail().withMessage('valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
    // Only allow customer or artisan; admin cannot be registered via API
    body('role').optional().isIn(['customer', 'artisan']).withMessage('role must be customer or artisan'),
  ],
  validate,
  asyncHandler(async (req, res) => sendSuccess(res, await authService.register(req.body), 'Registered', 201))
);

router.post(
  '/login',
  authRateLimiter,
  [body('email').isEmail().withMessage('valid email required').normalizeEmail(), body('password').notEmpty().withMessage('password required')],
  validate,
  asyncHandler(async (req, res) => sendSuccess(res, await authService.login(req.body), 'Logged in'))
);

router.get('/me', protect, (req, res) => sendSuccess(res, req.user.toJSON()));

module.exports = router;
