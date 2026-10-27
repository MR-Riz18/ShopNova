// Review controller
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Recompute a product's rating/numReviews from all its reviews
const recomputeProductRating = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) return;

  const all = await Review.find({ product: productId });
  product.numReviews = all.length;
  product.rating =
    all.length === 0
      ? 0
      : Math.round((all.reduce((sum, r) => sum + r.rating, 0) / all.length) * 10) / 10;
  await product.save();
};

// GET /api/reviews/product/:productId
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    throw new ApiError(400, 'Invalid product ID');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const total = await Review.countDocuments({ product: productId });
  const reviews = await Review.find({ product: productId })
    .populate('user', 'username avatar')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  return sendResponse(res, 200, 'Reviews fetched', {
    reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// POST /api/reviews (protect)
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body || {};

  if (!productId || !isValidObjectId(productId)) {
    throw new ApiError(400, 'Invalid product ID');
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be a number between 1 and 5');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const purchased = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    orderStatus: { $ne: 'cancelled' },
  });
  if (!purchased) {
    throw new ApiError(403, 'You can only review products you have purchased');
  }

  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) {
    throw new ApiError(400, 'You have already reviewed this product');
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    comment,
  });

  // Update product aggregate rating (running average)
  const prevCount = product.numReviews;
  product.numReviews = prevCount + 1;
  product.rating = Math.round((((product.rating * prevCount) + rating) / product.numReviews) * 10) / 10;
  await product.save();

  return sendResponse(res, 201, 'Review submitted', review);
});

// PUT /api/reviews/:id (protect)
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only edit your own review');
  }

  const { rating, comment } = req.body || {};

  if (rating !== undefined) {
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be a number between 1 and 5');
    }
    review.rating = rating;
  }
  if (comment !== undefined) review.comment = comment;

  await review.save();
  await recomputeProductRating(review.product);

  return sendResponse(res, 200, 'Review updated', review);
});

// DELETE /api/reviews/:id (protect; admin may delete any)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own review');
  }

  const productId = review.product;
  await review.deleteOne();
  await recomputeProductRating(productId);

  return sendResponse(res, 200, 'Review deleted', null);
});

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};
