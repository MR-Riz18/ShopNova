// Routes for /api/coupons
const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/admin');

router.post('/validate', protect, validateCoupon);
router.get('/', protect, authorizeAdmin, getAllCoupons);
router.post('/', protect, authorizeAdmin, createCoupon);
router.put('/:id', protect, authorizeAdmin, updateCoupon);
router.delete('/:id', protect, authorizeAdmin, deleteCoupon);

module.exports = router;
