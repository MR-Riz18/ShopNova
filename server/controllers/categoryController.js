// Category controller
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const Category = require('../models/Category');
const Product = require('../models/Product');

// GET /api/categories — includes productCount per category via $lookup
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'category',
        as: 'products',
      },
    },
    {
      $addFields: { productCount: { $size: '$products' } },
    },
    {
      $project: { products: 0 },
    },
    { $sort: { name: 1 } },
  ]);

  return sendResponse(res, 200, 'Categories fetched', categories);
});

// GET /api/categories/:slug
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return sendResponse(res, 200, 'Category fetched', category);
});

// POST /api/admin/categories (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body || {};

  if (!name) {
    throw new ApiError(400, 'Category name is required');
  }

  const existing = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
  if (existing) {
    throw new ApiError(400, 'Category already exists');
  }

  const category = await Category.create({
    name: name.trim(),
    description,
    // Slug is auto-generated from name by the model's save hook
    image: req.file ? `/uploads/${req.file.filename}` : image || '',
  });

  return sendResponse(res, 201, 'Category created', category);
});

// PUT /api/admin/categories/:id (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const { name, description } = req.body || {};

  if (name !== undefined && name.trim() !== '') {
    const existing = await Category.findOne({
      _id: { $ne: category._id },
      name: new RegExp(`^${name.trim()}$`, 'i'),
    });
    if (existing) {
      throw new ApiError(400, 'Category already exists');
    }
    category.name = name.trim();
  }
  if (description !== undefined) category.description = description;
  if (req.file) category.image = `/uploads/${req.file.filename}`;

  await category.save(); // re-runs the slug hook if the name changed

  return sendResponse(res, 200, 'Category updated', category);
});

// DELETE /api/admin/categories/:id (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new ApiError(
      400,
      'Cannot delete category with existing products. Reassign or delete the products first.'
    );
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  return sendResponse(res, 200, 'Category deleted', null);
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
