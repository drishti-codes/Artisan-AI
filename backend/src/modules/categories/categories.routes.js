const express = require('express');
const Category = require('./category.model');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => sendSuccess(res, await Category.find().sort({ _id: 1 }))));

module.exports = router;
