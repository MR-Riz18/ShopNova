// User controller: profile, password, addresses, admin user management
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const User = require('../models/User');

// GET /api/users/profile (protect)
const getProfile = asyncHandler(async (req, res) => {
  return sendResponse(res, 200, 'Profile fetched', req.user);
});

// PUT /api/users/profile (protect) — route may attach multer single('avatar') as req.file
const updateProfile = asyncHandler(async (req, res) => {
  const { username, phone } = req.body || {};

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (username !== undefined) user.username = username;
  if (phone !== undefined) user.phone = phone;
  if (req.file) user.avatar = `/uploads/${req.file.filename}`;

  await user.save();
  const updated = await User.findById(user._id).select('-password');

  return sendResponse(res, 200, 'Profile updated', updated);
});

// PUT /api/users/change-password (protect)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, 'All fields are required');
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New passwords do not match');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save(); // pre-save hook hashes the password

  return sendResponse(res, 200, 'Password changed successfully', null);
});

// POST /api/users/addresses (protect)
const addAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, address, city, state, postalCode, country, isDefault } = req.body || {};

  if (!fullName || !phone || !address || !city) {
    throw new ApiError(400, 'Full name, phone, address and city are required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const newAddress = { fullName, phone, address, city, state, postalCode, country };

  if (isDefault === true || user.addresses.length === 0) {
    user.addresses.forEach((a) => { a.isDefault = false; });
    newAddress.isDefault = true;
  }

  user.addresses.push(newAddress);
  await user.save();

  return sendResponse(res, 201, 'Address added', user.addresses);
});

// PUT /api/users/addresses/:addressId (protect)
const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const { fullName, phone, address, city, state, postalCode, country, isDefault } = req.body || {};

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const subdoc = user.addresses.id(addressId);
  if (!subdoc) {
    throw new ApiError(404, 'Address not found');
  }

  const allowed = {};
  if (fullName !== undefined) allowed.fullName = fullName;
  if (phone !== undefined) allowed.phone = phone;
  if (address !== undefined) allowed.address = address;
  if (city !== undefined) allowed.city = city;
  if (state !== undefined) allowed.state = state;
  if (postalCode !== undefined) allowed.postalCode = postalCode;
  if (country !== undefined) allowed.country = country;
  if (isDefault !== undefined) allowed.isDefault = isDefault;
  Object.assign(subdoc, allowed);

  if (isDefault === true) {
    user.addresses.forEach((a) => {
      if (a._id.toString() !== subdoc._id.toString()) a.isDefault = false;
    });
  }

  await user.save();

  return sendResponse(res, 200, 'Address updated', user.addresses);
});

// DELETE /api/users/addresses/:addressId (protect)
const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const subdoc = user.addresses.id(addressId);
  if (!subdoc) {
    throw new ApiError(404, 'Address not found');
  }

  subdoc.deleteOne();
  await user.save();

  return sendResponse(res, 200, 'Address removed', user.addresses);
});

// PUT /api/users/addresses/:addressId/default (protect)
const setDefaultAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const target = user.addresses.id(addressId);
  if (!target) {
    throw new ApiError(404, 'Address not found');
  }

  user.addresses.forEach((a) => {
    a.isDefault = a._id.toString() === target._id.toString();
  });
  await user.save();

  return sendResponse(res, 200, 'Default address updated', user.addresses);
});

// GET /api/admin/users (admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const filter = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ username: regex }, { email: regex }];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  return sendResponse(res, 200, 'Users fetched', {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/users/:id (admin)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return sendResponse(res, 200, 'User fetched', user);
});

// PUT /api/admin/users/:id/toggle-active (admin)
const toggleUserActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isActive = !user.isActive;
  await user.save();

  const safeUser = await User.findById(id).select('-password');
  return sendResponse(
    res,
    200,
    `User ${safeUser.isActive ? 'activated' : 'deactivated'} successfully`,
    safeUser
  );
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAllUsers,
  getUserById,
  toggleUserActive,
};
