const express = require('express');
const router = express.Router();
const { 
  sendOTP,
  verifyOTP,
  registerUser, 
  authUser, 
  getUserProfile, 
  updateUserProfile, 
  getLoyaltyStatus, 
  deleteUserAccount,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyStaffOTP,
  setupStaffPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/otpMiddleware');

// Phone OTP routes (Client app)
router.post('/send-otp', otpSendLimiter, sendOTP);
router.post('/verify-otp', otpVerifyLimiter, verifyOTP);

// Email-based auth (Admin/Chef/Rider backward compat)
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Staff Onboarding
router.post('/staff/verify-otp', otpVerifyLimiter, verifyStaffOTP);
router.post('/staff/setup-password', setupStaffPassword);

// Protected routes
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

router.get('/loyalty', getLoyaltyStatus);
router.post('/change-password', changePassword);
router.delete('/delete', deleteUserAccount);

module.exports = router;
