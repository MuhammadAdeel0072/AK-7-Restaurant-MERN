const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Fetch all unique categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    try {
        // Get all categories from the Category model
        // and also any unique categories from products (just in case)
        const dbCategories = await Category.find().lean();
        const productsCategories = await Product.distinct('category').lean();
        
        const dbCategoryNames = dbCategories.map(cat => cat.name);
        const allCategories = [...new Set([...dbCategoryNames, ...productsCategories])].filter(Boolean);
        
        const formattedCategories = allCategories.map(cat => ({
            _id: cat,
            name: cat,
            label: cat
        }));

        res.json(formattedCategories);
    } catch (error) {
        console.error('Fetch Categories Error:', error);
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

    const trimmedName = name.trim();
    
    // Check if exists
    let category = await Category.findOne({ name: trimmedName });
    
    if (!category) {
        category = await Category.create({ name: trimmedName });
    }

    res.status(201).json({ 
        success: true, 
        message: 'Category added successfully',
        category: {
            _id: category.name,
            name: category.name,
            label: category.name
        }
    });
});

// @desc    Delete a category
// @route   DELETE /api/categories/:name
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
    const { name } = req.params;

    await Category.findOneAndDelete({ name });

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
