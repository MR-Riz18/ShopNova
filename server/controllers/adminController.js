const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/ApiResponse');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

const getDashboardStats = asyncHandler(async (req, res) => {
  const salesAgg = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const totalSales = salesAgg.length ? salesAgg[0].total : 0;

  const [totalOrders, totalCustomers, totalProducts, pendingOrders] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
  ]);

  const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
    .select('name stock images')
    .sort({ stock: 1 })
    .limit(10);

  const recentOrders = await Order.find()
    .sort('-createdAt')
    .limit(5)
    .populate('user', 'username email')
    .select('orderId total orderStatus createdAt user');

  sendResponse(res, 200, 'Dashboard stats fetched', {
    totalSales,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    recentOrders,
  });
});

const last30Days = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
};

const toKey = (d) => d.toISOString().slice(0, 10);

const fillDaily = (days, map, buildEntry) =>
  days.map((d) => buildEntry(toKey(d), map[toKey(d)] || 0));

const getSalesChart = asyncHandler(async (req, res) => {
  const days = last30Days();
  const start = days[0];

  const rows = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = Object.fromEntries(rows.map((r) => [r._id, r.total]));
  const data = fillDaily(days, map, (date, total) => ({ date, total }));

  sendResponse(res, 200, 'Sales chart fetched', data);
});

const getOrdersChart = asyncHandler(async (req, res) => {
  const days = last30Days();
  const start = days[0];

  const rows = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = Object.fromEntries(rows.map((r) => [r._id, r.orders]));
  const data = fillDaily(days, map, (date, orders) => ({ date, orders }));

  sendResponse(res, 200, 'Orders chart fetched', data);
});

const getBestSellingProducts = asyncHandler(async (req, res) => {
  const rows = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        sold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$product.name',
        image: { $arrayElemAt: ['$product.images', 0] },
        price: '$product.price',
        sold: 1,
        revenue: 1,
      },
    },
  ]);

  sendResponse(res, 200, 'Best selling products fetched', rows);
});

const getRevenueByCategory = asyncHandler(async (req, res) => {
  const rows = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'p',
      },
    },
    { $unwind: '$p' },
    {
      $lookup: {
        from: 'categories',
        localField: 'p.category',
        foreignField: '_id',
        as: 'c',
      },
    },
    { $unwind: '$c' },
    {
      $group: {
        _id: '$c.name',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $project: { _id: 0, category: '$_id', revenue: 1 } },
  ]);

  sendResponse(res, 200, 'Revenue by category fetched', rows);
});

module.exports = {
  getDashboardStats,
  getSalesChart,
  getOrdersChart,
  getBestSellingProducts,
  getRevenueByCategory,
};
