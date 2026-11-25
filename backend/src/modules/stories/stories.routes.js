const express = require('express');
const Story = require('./story.model');
const Artisan = require('../artisans/artisan.model');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => sendSuccess(res, await Story.find().sort({ _id: 1 }))));

// Story with its artisan included
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const story = await Story.findOne({ slug: req.params.id.toLowerCase() });
    if (!story) throw new AppError('Story not found', 404);
    const artisan = await Artisan.findOne({ slug: story.artisanId });
    return sendSuccess(res, { ...story.toJSON(), artisan: artisan ? artisan.toJSON() : null });
  })
);

module.exports = router;
