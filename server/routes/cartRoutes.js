const express = require('express');
const router = express.Router();
const { getCart, updateCart, clearCart } = require('../controllers/cartController');
const { protect, ClerkExpressRequireAuth } = require('../middleware/clerkAuth');

router.route('/')
    .get(ClerkExpressRequireAuth(), protect, getCart)
    .post(ClerkExpressRequireAuth(), protect, updateCart)
    .delete(ClerkExpressRequireAuth(), protect, clearCart);

module.exports = router;
