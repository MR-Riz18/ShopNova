// Auth controller: register, login, getMe, logout
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const User = require('../models/User');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { username, email, password, confirmPassword } = req.body || {};

  if (!username || !email || !password || !confirmPassword) {
    throw new ApiError(400, 'All fields are required');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(400, 'Email already registered');
  }

  // Password is hashed by the pre-save hook on the User model
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password,
  });

  const token = user.getSignedJwtToken();

  return sendResponse(res, 201, 'Registration successful', {
    token,
    user: { id: user._id, username: user.username, email: user.email, role: user.role },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been disabled. Please contact support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = user.getSignedJwtToken();

  return sendResponse(res, 200, 'Login successful', {
    token,
    user: { id: user._id, username: user.username, email: user.email, role: user.role },
  });
});

// GET /api/auth/me (protect)
const getMe = asyncHandler(async (req, res) => {
  return sendResponse(res, 200, 'User profile fetched', req.user);
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  // JWTs are stateless: there is no server-side session to destroy.
  // The client simply discards the token.
  return sendResponse(res, 200, 'Logged out successfully', null);
});

module.exports = { register, login, getMe, logout };
