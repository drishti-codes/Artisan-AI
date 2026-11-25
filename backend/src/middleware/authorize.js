// Middleware to enforce role‑based access
// Usage: router.get('/path', protect, authorize('artisan','admin'), handler)

module.exports = function authorize(...allowedRoles) {
  return (req, res, next) => {
    // protect middleware should have populated req.user
    if (!req.user) {
      // 401 – not authenticated
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      // 403 – authenticated but not authorized
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
};
