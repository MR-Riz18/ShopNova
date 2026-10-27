// Coupon controller
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const Coupon = require('../models/Coupon');

// POST /api/coupons/validate (protect)
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount = 0 } = req.body || {};

  if (!code) {
    throw new ApiError(400, 'Coupon code is required');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon) {
    throw new ApiError(404, 'Invalid coupon code');
  }
  if (!coupon.isActive) {
    throw new ApiError(400, 'This coupon is inactive');
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(400, 'This coupon has expired');
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit reached');
  }
  if (orderAmount < coupon.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount for this coupon is Rs ${coupon.minOrderAmount}`);
  }

  const discountAmount =
    coupon.discountType === 'percent'
      ? Math.min(Math.round((orderAmount * coupon.discountValue) / 100), coupon.maxDiscount || Infinity)
      : Math.min(coupon.discountValue, orderAmount);

  return sendResponse(res, 200, 'Coupon is valid', {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
  });
});

// GET /api/admin/coupons (admin)
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  return sendResponse(res, 200, 'Coupons fetched', coupons);
});

// POST /api/admin/coupons (admin)
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    expiresAt,
    usageLimit,
    isActive,
  } = req.body || {};

  if (!code) {
    throw new ApiError(400, 'Coupon code is required');
  }
  if (!['percent', 'fixed'].includes(discountType)) {
    throw new ApiError(400, 'Discount type must be either "percent" or "fixed"');
  }
  if (discountValue === undefined || discountValue === null || discountValue < 0) {
    throw new ApiError(400, 'Discount value must be a non-negative number');
  }

  const normalizedCode = code.toUpperCase().trim();
  const existing = await Coupon.findOne({ code: normalizedCode });
  if (existing) {
    throw new ApiError(400, 'Coupon code already exists');
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    expiresAt,
    usageLimit,
    isActive,
  });

  return sendResponse(res, 201, 'Coupon created', coupon);
});

// PUT /api/admin/coupons/:id (admin)
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }
  return sendResponse(res, 200, 'Coupon updated', coupon);
});

// DELETE /api/admin/coupons/:id (admin)
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }
  return sendResponse(res, 200, 'Coupon deleted', null);
});

module.exports = {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
