// Checks the JWT token ("Authorization: Bearer <token>") and puts the user in req.user.
const jwt = require('jsonwebtoken');
const User = require('../modules/auth/user.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Please log in to continue', 401);

  if (!process.env.JWT_SECRET) throw new AppError('Server is missing JWT_SECRET in .env', 500);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired token, please log in again', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('This user no longer exists', 401);

  req.user = user;
  next();
});
