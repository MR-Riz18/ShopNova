const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const populateFields = 'name slug price originalPrice discount images rating numReviews stock brand';

const fetchPopulated = (userId) =>
  Wishlist.findOne({ user: userId }).populate('products', populateFields);

const getWishlist = asyncHandler(async (req, res) => {
  const doc = await fetchPopulated(req.user._id);
  sendResponse(res, 200, 'Wishlist fetched', { products: doc ? doc.products : [] });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'Invalid product');
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  let doc = await Wishlist.findOne({ user: req.user._id });
  if (!doc) doc = await Wishlist.create({ user: req.user._id, products: [] });

  if (doc.products.some((p) => p.toString() === productId)) {
    throw new ApiError(400, 'Product is already in your wishlist');
  }

  doc.products.push(productId);
  await doc.save();

  const populated = await fetchPopulated(req.user._id);
  sendResponse(res, 200, 'Added to wishlist', { products: populated.products });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const doc = await Wishlist.findOne({ user: req.user._id });
  if (doc) {
    doc.products.pull(productId);
    await doc.save();
  }

  const populated = await fetchPopulated(req.user._id);
  sendResponse(res, 200, 'Removed from wishlist', {
    products: populated ? populated.products : [],
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
