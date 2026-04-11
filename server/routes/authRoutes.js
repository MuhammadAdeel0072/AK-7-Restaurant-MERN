const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  authUser, 
  getUserProfile, 
  updateUserProfile, 
  getLoyaltyStatus, 
  deleteUserAccount,
  forgotPassword,
  resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

router.get('/loyalty', getLoyaltyStatus);
router.delete('/delete', deleteUserAccount);

module.exports = router;

