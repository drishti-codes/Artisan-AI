const jwt = require('jsonwebtoken');
const User = require('./user.model');
const AppError = require('../../utils/AppError');

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new AppError('Server is missing JWT_SECRET in .env', 500);
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// New accounts are always customers. Artisan/admin accounts come from the seed script.
async function register({ name, email, password, role = 'customer' }) {
  // only allow customer or artisan; reject any other role
  if (!['customer', 'artisan'].includes(role)) {
    throw new AppError('Role must be customer or artisan', 400);
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new AppError('Email already registered', 409);
  const user = await User.create({ name, email, password, role });
  return { token: signToken(user), user: user.toJSON() };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  const ok = user && (await user.comparePassword(password));
  if (!ok) throw new AppError('Invalid email or password', 401); // same message for both cases on purpose
  return { token: signToken(user), user: user.toJSON() };
}

module.exports = { register, login, signToken };
