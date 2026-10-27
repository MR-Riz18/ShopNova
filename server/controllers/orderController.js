const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const PAYMENT_METHODS = ['cod', 'card', 'bank_transfer'];
const DELIVERY_METHODS = ['standard', 'express'];

const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress = {},
    paymentMethod = 'cod',
    deliveryMethod = 'standard',
    couponCode,
  } = req.body;

  const { fullName, phone, address, city, state, postalCode, country } = shippingAddress;
  if (!fullName || !phone || !address || !city || !state || !postalCode || !country) {
    throw new ApiError(400, 'Shipping information is incomplete');
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ApiError(400, 'Invalid payment method');
  }
  if (!DELIVERY_METHODS.includes(deliveryMethod)) {
    throw new ApiError(400, 'Invalid delivery method');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || !cart.items.length) {
    throw new ApiError(400, 'Your cart is empty');
  }

  // Re-fetch prices server-side; never trust frontend prices.
  const orderItems = [];
  let subtotal = 0;
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.stock < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for "${product.name}". Only ${product.stock} available.`
      );
    }
    const price = product.price;
    subtotal += price * item.quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images && product.images[0] ? product.images[0] : '',
      price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    });
  }

  // Coupon
  let discount = 0;
  let couponData = null;
  if (couponCode) {
    const code = String(couponCode).toUpperCase().trim();
    const coupon = await Coupon.findOne({ code });
    if (!coupon) throw new ApiError(400, 'Invalid coupon code');
    if (!coupon.isActive) throw new ApiError(400, 'This coupon is no longer active');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new ApiError(400, 'This coupon has expired');
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, 'This coupon has reached its usage limit');
    }
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      throw new ApiError(
        400,
        `This coupon requires a minimum order of Rs ${coupon.minOrderAmount}`
      );
    }
    discount =
      coupon.discountType === 'percent'
        ? Math.min(Math.round((subtotal * coupon.discountValue) / 100), coupon.maxDiscount || Infinity)
        : Math.min(coupon.discountValue, subtotal);
    couponData = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };
    coupon.usedCount += 1;
    await coupon.save();
  }

  const shipping = deliveryMethod === 'express' ? 350 : subtotal >= 5000 ? 0 : 150;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + shipping + tax;

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const order = await Order.create({
    user: req.user._id,
    orderId,
    items: orderItems,
    shippingAddress: { fullName, phone, address, city, state, postalCode, country },
    paymentMethod,
    // Real gateway integrations would confirm card/bank payments asynchronously.
    // Never store raw card data here.
    paymentStatus: 'pending',
    orderStatus: 'pending',
    subtotal,
    shipping,
    tax,
    discount,
    total,
    ...(couponData ? { coupon: couponData } : {}),
    timeline: [{ status: 'pending', note: 'Order placed', date: new Date() }],
  });

  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }

  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

  sendResponse(res, 201, 'Order placed successfully', order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  sendResponse(res, 200, 'Orders fetched', {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id).populate('user', 'username email phone');
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this order');
  }

  sendResponse(res, 200, 'Order fetched', order);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  if (!['pending', 'confirmed'].includes(order.orderStatus)) {
    throw new ApiError(400, 'This order can no longer be cancelled');
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }

  order.orderStatus = 'cancelled';
  order.timeline.push({ status: 'cancelled', note: 'Order cancelled by customer', date: new Date() });
  await order.save();

  sendResponse(res, 200, 'Order cancelled', order);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const {
    status,
    customer,
    paymentMethod,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};

  if (status) filter.orderStatus = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (customer) {
    if (mongoose.isValidObjectId(customer)) {
      filter.user = customer;
    } else {
      const regex = new RegExp(String(customer).trim(), 'i');
      const users = await User.find({ $or: [{ email: regex }, { username: regex }] }).select('_id');
      filter.user = { $in: users.map((u) => u._id) };
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'username email')
    .sort('-createdAt')
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  sendResponse(res, 200, 'Orders fetched', {
    orders,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (status === 'cancelled' && order.orderStatus !== 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  order.orderStatus = status;
  order.timeline.push({ status, note: note || `Order ${status}`, date: new Date() });
  await order.save();

  sendResponse(res, 200, 'Order status updated', order);
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
