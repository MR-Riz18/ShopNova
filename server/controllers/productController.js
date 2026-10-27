const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/ApiResponse');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const resolveCategoryId = async (category) => {
  if (!category) throw new ApiError(400, 'Invalid category');
  if (mongoose.isValidObjectId(category)) {
    const cat = await Category.findById(category);
    if (!cat) throw new ApiError(400, 'Invalid category');
    return cat._id;
  }
  const cat = await Category.findOne({ slug: String(category).trim().toLowerCase() });
  if (!cat) throw new ApiError(400, 'Invalid category');
  return cat._id;
};

const computeDiscount = (price, originalPrice) => {
  if (originalPrice && originalPrice > price) {
    return Math.round((1 - price / originalPrice) * 100);
  }
  return 0;
};

const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    size,
    color,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

  const filter = {};

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { description: regex }, { brand: regex }];
  }

  if (category) {
    if (mongoose.isValidObjectId(category)) {
      filter.category = category;
    } else {
      const cat = await Category.findOne({ slug: String(category).trim().toLowerCase() });
      if (!cat) {
        return sendResponse(res, 200, 'Products fetched', {
          products: [],
          pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
        });
      }
      filter.category = cat._id;
    }
  }

  if (brand) filter.brand = new RegExp(String(brand).trim(), 'i');

  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== '') {
    const min = Number(minPrice);
    if (!Number.isNaN(min)) priceFilter.$gte = min;
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const max = Number(maxPrice);
    if (!Number.isNaN(max)) priceFilter.$lte = max;
  }
  if (Object.keys(priceFilter).length) filter.price = priceFilter;

  if (minRating !== undefined && minRating !== '') {
    const r = Number(minRating);
    if (!Number.isNaN(r)) filter.rating = { $gte: r };
  }

  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (size) filter.sizes = size;
  if (color) filter.colors = new RegExp(String(color).trim(), 'i');

  const sortMap = {
    featured: { featured: -1, createdAt: -1 },
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
    popular: { numReviews: -1 },
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .sort(sortBy)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  sendResponse(res, 200, 'Products fetched', {
    products,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  let product = await Product.findOne({ slug }).populate('category', 'name slug');
  if (!product && mongoose.isValidObjectId(slug)) {
    product = await Product.findById(slug).populate('category', 'name slug');
  }
  if (!product) throw new ApiError(404, 'Product not found');
  sendResponse(res, 200, 'Product fetched', product);
});

const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    originalPrice,
    category,
    brand,
    sizes,
    colors,
    stock,
    featured,
    bestSeller,
    isNew,
    specifications,
    images: bodyImages,
  } = req.body;

  if (!name || !description || price === undefined || !category) {
    throw new ApiError(400, 'name, description, price and category are required');
  }

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    throw new ApiError(400, 'Price must be a valid non-negative number');
  }

  const categoryId = await resolveCategoryId(category);

  let images = [];
  if (req.files && req.files.length) {
    images = req.files.map((f) => `/uploads/${f.filename}`);
  } else if (bodyImages) {
    const parsed = parseJsonField(bodyImages, bodyImages);
    images = Array.isArray(parsed) ? parsed : [];
  }

  const parsedSizes = parseJsonField(sizes, []);
  const parsedColors = parseJsonField(colors, []);
  const parsedSpecs = parseJsonField(specifications, []);

  const numericOriginal = originalPrice !== undefined && originalPrice !== ''
    ? Number(originalPrice)
    : undefined;

  const product = await Product.create({
    name,
    description,
    price: numericPrice,
    originalPrice: numericOriginal,
    discount: computeDiscount(numericPrice, numericOriginal),
    category: categoryId,
    brand,
    images,
    stock: stock !== undefined && stock !== '' ? Number(stock) : 0,
    sizes: Array.isArray(parsedSizes) ? parsedSizes : [],
    colors: Array.isArray(parsedColors) ? parsedColors : [],
    featured: featured === true || featured === 'true',
    bestSeller: bestSeller === true || bestSeller === 'true',
    isNew: isNew === true || isNew === 'true',
    specifications: Array.isArray(parsedSpecs) ? parsedSpecs : [],
  });

  const populated = await Product.findById(product._id).populate('category', 'name slug');
  sendResponse(res, 201, 'Product created', populated);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  const updatable = [
    'name', 'description', 'price', 'originalPrice', 'category', 'brand',
    'sizes', 'colors', 'stock', 'featured', 'bestSeller', 'isNew', 'specifications',
  ];

  for (const field of updatable) {
    if (req.body[field] === undefined) continue;
    let value = req.body[field];

    if (field === 'category') {
      value = await resolveCategoryId(value);
    } else if (['sizes', 'colors', 'specifications'].includes(field)) {
      value = parseJsonField(value, product[field]);
      if (!Array.isArray(value)) value = product[field];
    } else if (['featured', 'bestSeller', 'isNew'].includes(field)) {
      value = value === true || value === 'true';
    } else if (['price', 'originalPrice', 'stock'].includes(field)) {
      if (value === '') {
        if (field === 'originalPrice') value = undefined;
        else continue;
      } else {
        const n = Number(value);
        if (Number.isNaN(n)) throw new ApiError(400, `${field} must be a valid number`);
        value = n;
      }
    }
    product[field] = value;
  }

  if (req.files && req.files.length) {
    product.images = req.files.map((f) => `/uploads/${f.filename}`);
  }

  product.discount = computeDiscount(product.price, product.originalPrice);
  await product.save();
  const populated = await Product.findById(product._id).populate('category', 'name slug');
  sendResponse(res, 200, 'Product updated', populated);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new ApiError(404, 'Product not found');

  await Cart.updateMany({}, { $pull: { items: { product: id } } });
  await Wishlist.updateMany({}, { $pull: { products: id } });

  sendResponse(res, 200, 'Product deleted', null);
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limitNum = Number(req.query.limit) || 8;
  const products = await Product.find({ featured: true })
    .populate('category', 'name slug')
    .limit(limitNum);
  sendResponse(res, 200, 'Featured products fetched', products);
});

const getBestSellers = asyncHandler(async (req, res) => {
  const limitNum = Number(req.query.limit) || 8;
  const products = await Product.find({ bestSeller: true })
    .populate('category', 'name slug')
    .limit(limitNum);
  sendResponse(res, 200, 'Best sellers fetched', products);
});

const getNewArrivals = asyncHandler(async (req, res) => {
  const limitNum = Number(req.query.limit) || 8;
  const products = await Product.find({ isNew: true })
    .sort('-createdAt')
    .limit(limitNum)
    .populate('category', 'name slug');
  sendResponse(res, 200, 'New arrivals fetched', products);
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const products = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  })
    .limit(8)
    .populate('category', 'name slug');

  sendResponse(res, 200, 'Related products fetched', products);
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getRelatedProducts,
};
