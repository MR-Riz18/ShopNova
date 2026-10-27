// Routes for /api/categories
const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/admin');
const upload = require('../middleware/upload');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', protect, authorizeAdmin, upload.single('image'), createCategory);
router.put('/:id', protect, authorizeAdmin, upload.single('image'), updateCategory);
router.delete('/:id', protect, authorizeAdmin, deleteCategory);

module.exports = router;
