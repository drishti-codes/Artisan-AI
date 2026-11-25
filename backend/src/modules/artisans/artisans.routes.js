const express = require('express');
const service = require('./artisans.service');
const protect = require('../../middleware/protect');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => sendSuccess(res, await service.listArtisans())));
router.get('/:id', asyncHandler(async (req, res) => sendSuccess(res, await service.getArtisan(req.params.id))));
router.get('/:id/products', asyncHandler(async (req, res) => sendSuccess(res, await service.getArtisanProducts(req.params.id))));
router.get('/:id/following', protect, asyncHandler(async (req, res) => sendSuccess(res, await service.getFollowStatus(req.user._id, req.params.id))));
router.post('/:id/follow', protect, asyncHandler(async (req, res) => sendSuccess(res, await service.toggleFollow(req.user._id, req.params.id))));

module.exports = router;
