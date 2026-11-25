// Lets us write async route handlers without try/catch. Errors go to the global error handler.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
