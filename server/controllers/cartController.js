const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
        res.json(cart.items);
    } else {
        res.json([]);
    }
});

// @desc    Update user cart (sync)
// @route   POST /api/cart
// @access  Private
const updateCart = asyncHandler(async (req, res) => {
    const { cartItems } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        cart.items = cartItems;
        await cart.save();
    } else {
        cart = await Cart.create({
            user: req.user._id,
            items: cartItems
        });
    }

    res.json(cart.items);
});

// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ message: 'Cart cleared' });
});

module.exports = {
    getCart,
    updateCart,
    clearCart
};
