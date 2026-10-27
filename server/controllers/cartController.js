const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const buildCartResponse = async (cart) => {
  await cart.populate('items.product', 'name slug price images stock brand');
  const items = cart.items.filter((item) => item.product);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { _id: cart._id, items, subtotal, itemCount };
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return sendResponse(res, 200, 'Cart fetched', { items: [], subtotal: 0, itemCount: 0 });
  }
  sendResponse(res, 200, 'Cart fetched', await buildCartResponse(cart));
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size, color } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'Invalid product');
  }

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  if (product.stock < qty) {
    throw new ApiError(400, `Only ${product.stock} item(s) available in stock`);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existing = cart.items.find(
    (i) =>
      i.product.toString() === productId &&
      (i.size || '') === (size || '') &&
      (i.color || '') === (color || '')
  );

  if (existing) {
    const newQty = existing.quantity + qty;
    if (product.stock < newQty) {
      throw new ApiError(400, `Only ${product.stock} item(s) available in stock`);
    }
    existing.quantity = newQty;
    existing.price = product.price; // refresh server-side price snapshot
  } else {
    cart.items.push({ product: productId, quantity: qty, size, color, price: product.price });
  }

  await cart.save();
  sendResponse(res, 200, 'Item added to cart', await buildCartResponse(cart));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.stock < qty) {
      throw new ApiError(400, `Only ${product.stock} item(s) available in stock`);
    }
    item.quantity = qty;
    item.price = product.price; // refresh server-side price snapshot
  }

  await cart.save();
  sendResponse(res, 200, 'Cart updated', await buildCartResponse(cart));
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');

  item.deleteOne();
  await cart.save();
  sendResponse(res, 200, 'Item removed', await buildCartResponse(cart));
});

const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [] } },
    { upsert: true, new: true }
  );
  sendResponse(res, 200, 'Cart cleared', { items: [], subtotal: 0, itemCount: 0 });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
