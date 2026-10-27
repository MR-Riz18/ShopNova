const ApiError = require('../utils/ApiError');

const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Admins only.');
  }
  next();
};

module.exports = { authorizeAdmin };
