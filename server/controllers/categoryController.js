const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// Store in-memory categories for newly added ones (not yet in products)
let customCategories = [];

// @desc    Fetch all unique categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    try {
        // Get all unique categories from products
        const productsCategories = await Product.distinct('category').lean();
        
        // Combine with custom categories
        const allCategories = [...new Set([...productsCategories, ...customCategories])].filter(Boolean);
        
        // Return as array of objects for frontend compatibility
        const formattedCategories = allCategories.map(cat => ({
            _id: cat,
            name: cat,
            label: cat
        }));

        res.json(formattedCategories);
    } catch (error) {
        res.status(500);
        throw new Error('Failed to fetch categories');
    }
});

// @desc    Add a new category
// @route   POST /api/categories
// @access  Private/Admin
const addCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        res.status(400);
        throw new Error('Category name is required');
    }

    if (!customCategories.includes(name.trim())) {
        customCategories.push(name.trim());
    }

    res.status(201).json({ 
        success: true, 
        message: 'Category added successfully',
        category: {
            _id: name.trim(),
            name: name.trim(),
            label: name.trim()
        }
    });
});

// @desc    Delete a category
// @route   DELETE /api/categories/:name
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
    const { name } = req.params;

    customCategories = customCategories.filter(cat => cat !== name);

    res.json({ 
        success: true, 
        message: 'Category deleted successfully'
    });
});

// @desc    Get products by category
// @route   GET /api/categories/:categoryName/products
// @access  Public
const getCategoryProducts = asyncHandler(async (req, res) => {
    const { categoryName } = req.params;

    if (!categoryName) {
        res.status(400);
        throw new Error('Category name is required');
    }

    const products = await Product.find({ category: categoryName }).lean();

    res.json(products || []);
});

module.exports = {
    getCategories,
    addCategory,
    deleteCategory,
    getCategoryProducts
};
