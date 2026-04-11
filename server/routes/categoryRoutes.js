const express = require('express');
const router = express.Router();
const {
    getCategories,
    addCategory,
    deleteCategory,
    getCategoryProducts
} = require('../controllers/categoryController');

router.get('/', getCategories);
router.post('/', addCategory);
router.delete('/:name', deleteCategory);
router.get('/:categoryName/products', getCategoryProducts);

module.exports = router;
