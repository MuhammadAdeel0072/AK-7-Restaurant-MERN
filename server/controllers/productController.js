const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { emitEvent } = require('../services/socketService');
const { getCachedMenu, setCachedMenu, clearMenuCache } = require('../services/cacheService');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { category, isSpecial, dietary } = req.query;
  
  // Try to get from cache if no filters
  if (!category && !isSpecial && !dietary) {
    const cached = getCachedMenu();
    if (cached) return res.json(cached);
  }

  const query = {};
  if (category) query.category = category;
  if (isSpecial) query.isSpecial = isSpecial === 'true';
  if (dietary) query.dietaryInfo = { $in: dietary.split(',') };

  let products = await Product.find(query).lean();
  
  // Safety check for empty results or missing image URLs
  products = (products || []).map(product => ({
    ...product,
    image: product.image || '/images/sample.jpg'
  }));
  
  // Set cache if no filters
  if (!category && !isSpecial && !dietary) {
    setCachedMenu(products);
  }

  res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, category, countInStock, isSpecial, dietaryInfo, customizations } = req.body;

  // Basic validation
  if (!name || !price || !category) {
    res.status(400);
    throw new Error('Please provide name, price, and category');
  }

  const product = new Product({
    name,
    price,
    image: image || '/images/sample.jpg',
    category,
    countInStock: countInStock || 0,
    description: description || '',
    isSpecial: isSpecial || false,
    dietaryInfo: dietaryInfo || [],
    customizations: customizations || [],
  });

  const createdProduct = await product.save();
  
  clearMenuCache();
  emitEvent(null, 'productUpdated', createdProduct);
  emitEvent(null, 'adminAction', { type: 'menuUpdate' });

  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, category, countInStock, isSpecial, dietaryInfo, customizations } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.image = image || product.image;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
    product.isSpecial = isSpecial !== undefined ? isSpecial : product.isSpecial;
    product.dietaryInfo = dietaryInfo || product.dietaryInfo;
    product.customizations = customizations || product.customizations;

    const updatedProduct = await product.save();

    clearMenuCache();
    emitEvent(null, 'productUpdated', updatedProduct);
    emitEvent(null, 'adminAction', { type: 'menuUpdate' });

    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });

    clearMenuCache();
    emitEvent(null, 'productUpdated', { _id: product._id, deleted: true });
    emitEvent(null, 'adminAction', { type: 'menuUpdate' });

    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
