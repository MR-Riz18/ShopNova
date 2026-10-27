// Routes for /api/admin
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesChart,
  getOrdersChart,
  getBestSellingProducts,
  getRevenueByCategory,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/admin');

router.get('/dashboard', protect, authorizeAdmin, getDashboardStats);
router.get('/sales-chart', protect, authorizeAdmin, getSalesChart);
router.get('/orders-chart', protect, authorizeAdmin, getOrdersChart);
router.get('/best-sellers', protect, authorizeAdmin, getBestSellingProducts);
router.get('/revenue-by-category', protect, authorizeAdmin, getRevenueByCategory);

module.exports = router;
