// Use after express-validator rules: returns a 400 with the list of problems.
const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return sendError(res, 'Validation failed', 400, result.array().map((e) => `${e.path}: ${e.msg}`));
};
