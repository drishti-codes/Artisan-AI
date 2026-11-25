const express = require('express');
const rateLimit = require('express-rate-limit');
const { discoverController } = require('./discover.service');

const router = express.Router();

// Stricter rate limit: 12 requests per minute per IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests, please try again later.' },
});

router.post('/discover', aiRateLimiter, discoverController);

module.exports = router;
