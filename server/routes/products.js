// Routes for /api/products
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getRelatedProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/admin');
const upload = require('../middleware/upload');

// NOTE: specific GET routes must come before GET /:slug
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/related/:productId', getRelatedProducts);
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);
router.post('/', protect, authorizeAdmin, upload.array('images', 5), createProduct);
router.put('/:id', protect, authorizeAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorizeAdmin, deleteProduct);

module.exports = router;
