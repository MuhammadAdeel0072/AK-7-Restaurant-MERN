const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  authUser, 
  getUserProfile, 
  updateUserProfile, 
  getCart, 
  updateCart, 
  getLoyaltyStatus, 
  deleteUserAccount 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);

// Protected routes
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.route('/cart').get(getCart).post(updateCart);
router.get('/loyalty', getLoyaltyStatus);
router.delete('/delete', deleteUserAccount);

module.exports = router;

