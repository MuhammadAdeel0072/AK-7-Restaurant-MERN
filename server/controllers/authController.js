const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const LoyaltyTransaction = require('../models/Loyalty');
const { sendOTPEmail } = require('../services/emailService');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ============================
// 📱 PHONE OTP AUTHENTICATION
// ============================

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email format. Please enter a valid email.');
  }

  // Check if there's already a recent OTP for this email (prevent spam)
  const recentOTP = await OTP.findOne({
    email: email.toLowerCase(),
    createdAt: { $gt: new Date(Date.now() - 30 * 1000) } // within last 30 seconds
  });

  if (recentOTP) {
    res.status(429);
    throw new Error('OTP already sent. Please wait 30 seconds before requesting a new one.');
  }

  // Delete any existing OTPs for this email
  await OTP.deleteMany({ email: email.toLowerCase() });

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in DB with 5-minute TTL (Plain text for 6-digit OTP reliability)
  await OTP.create({
    email: email.toLowerCase(),
    otp: otpCode,
    attempts: 0
  });

  // Send OTP via email
  const emailSent = await sendOTPEmail(email.toLowerCase(), otpCode);

  if (!emailSent) {
    // If email fails, we still log it in dev for convenience
    console.log(`\n📧 [OTP FALLBACK] Code for ${email}: ${otpCode}\n`);
  }

  res.status(200).json({
    success: true,
    message: emailSent ? 'OTP sent to your email successfully' : 'OTP generated (Email failed, check console)',
    // Only include OTP in development for testing
    ...(process.env.NODE_ENV === 'development' && { devOTP: otpCode })
  });
});

// @desc    Verify OTP and authenticate
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const cleanEmail = email.toLowerCase();

  // Find the OTP record
  const otpRecord = await OTP.findOne({ email: cleanEmail });

  // DEBUG LOGGING
  console.log(`\n🔍 [AUTH DEBUG] Verification Attempt:`);
  console.log(`- Received Email: ${cleanEmail}`);
  console.log(`- Received OTP  : ${otp}`);
  console.log(`- DB Record Found: ${otpRecord ? 'YES ✅' : 'NO ❌'}`);
  if (otpRecord) {
    console.log(`- DB Stored OTP: ${otpRecord.otp}`);
    console.log(`- Match Result : ${otp === otpRecord.otp ? 'MATCH' : 'MISMATCH'}`);
  }
  console.log(`---------------------------\n`);

  if (!otpRecord) {
    res.status(401);
    throw new Error('OTP expired or not found. Please request a new OTP.');
  }

  // Check brute force attempts
  if (otpRecord.attempts >= 5) {
    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(429);
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  // Compare OTP (Direct string match)
  const isMatch = (otp === otpRecord.otp);

  if (!isMatch) {
    // Increment attempt counter
    otpRecord.attempts += 1;
    await otpRecord.save();

    const remaining = 5 - otpRecord.attempts;
    res.status(401);
    throw new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
  }

  // OTP verified! Delete the record
  await OTP.deleteOne({ _id: otpRecord._id });

  // Find or create user by email
  let user = await User.findOne({ email: cleanEmail });

  if (!user) {
    // Auto-register new user
    user = await User.create({
      email: cleanEmail,
      firstName: 'User',
      lastName: '',
      role: 'customer'
    });
    console.log(`✅ New user auto-registered via OTP: ${cleanEmail}`);
  } else {
    console.log(`✅ Existing user authenticated via OTP: ${cleanEmail}`);
  }

  const token = generateToken(user._id);

  res.status(200).json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    phone: user.phone,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    favorites: user.favorites,
    addresses: user.addresses,
    loyaltyPoints: user.loyaltyPoints,
    loyaltyTier: user.loyaltyTier,
    token
  });
});

// ============================
// 📧 EMAIL AUTH (Admin/Chef/Rider backward compat)
// ============================

// @desc    Register a new user (email-based — admin/chef/rider)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    console.error('❌ Registration Error: Missing required fields', { email: !!email, password: !!password });
    res.status(400);
    throw new Error('Email and password are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`❌ Registration Error: Invalid email format: ${email}`);
    res.status(400);
    throw new Error('Invalid email format');
  }

  // Validate password length
  if (password.length < 6) {
    console.error('❌ Registration Error: Password too short');
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    console.error(`❌ Registration Error: User already exists: ${email}`);
    res.status(400);
    throw new Error('User already exists');
  }

  try {
    console.log(`📝 Creating new user: ${email}`);
    const user = await User.create({
      firstName: firstName || 'User',
      lastName: lastName || '',
      email,
      password,
      role: 'customer',
    });

    console.log(`✅ User created successfully: ${email}`);

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        favorites: user.favorites,
        addresses: user.addresses,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyTier: user.loyaltyTier,
        token: token,
      });
    } else {
      console.error('❌ Registration Error: Failed to create user');
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    console.error('❌ Registration Error:', error.message);
    throw error;
  }
});

// @desc    Authenticate user & get token (email-based — admin/chef/rider)
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    console.error('❌ Login Error: Missing email or password', { email: !!email, password: !!password });
    res.status(400);
    throw new Error('Email and password are required');
  }

  // Find user
  const user = await User.findOne({ email });
  console.log(`🔍 User lookup for ${email}:`, user ? 'Found' : 'Not found');

  // Check if user exists
  if (!user) {
    console.error(`❌ Login Error: User not found for email: ${email}`);
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if account is active and onboarded (for staff)
  if (!user.isActive || !user.isOnboarded) {
    res.status(401);
    throw new Error('Your account is not fully setup or is inactive. Please complete onboarding or contact admin.');
  }

  // Verify password field exists and is valid
  if (!user.password || typeof user.password !== 'string') {
    console.error(`❌ Login Error: User found but password field is corrupted for ${email}`);
    res.status(500);
    throw new Error('Server error: User account data is corrupted. Please contact support.');
  }

  // Compare passwords safely
  let isPasswordValid = false;
  try {
    isPasswordValid = await user.matchPassword(password);
    console.log(`🔐 Password comparison result for ${email}:`, isPasswordValid ? 'MATCH ✅' : 'FAIL ❌');
  } catch (bcryptError) {
    console.error(`❌ Bcrypt Error during password comparison for ${email}:`, bcryptError.message);
    res.status(500);
    throw new Error('Server error: Password verification failed. Account data might be inconsistent.');
  }

  if (isPasswordValid) {
    const token = generateToken(user._id);
    console.log(`✅ Login successful for ${email}`);
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      phoneNumber: user.phoneNumber,
      role: user.role,
      avatar: user.avatar,
      favorites: user.favorites,
      addresses: user.addresses,
      loyaltyPoints: user.loyaltyPoints,
      loyaltyTier: user.loyaltyTier,
      token: token,
    });
  } else {
    console.error(`❌ Login Error: Invalid password for ${email}`);
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile (Self)
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password').lean();

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { firstName, lastName, phone, addresses, avatar, password, favorites } = req.body;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (avatar !== undefined) user.avatar = avatar;
  if (phone !== undefined) user.phone = phone;

  if (addresses !== undefined) user.addresses = addresses;
  if (favorites !== undefined) user.favorites = favorites;

  if (password) {
    user.password = password;
  }

  const updated = await user.save();
  res.json({
    _id: updated._id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
    phone: updated.phone,
    role: updated.role,
    avatar: updated.avatar,
    addresses: updated.addresses,
    favorites: updated.favorites,
    loyaltyPoints: updated.loyaltyPoints,
    loyaltyTier: updated.loyaltyTier,
    token: generateToken(updated._id),
  });
});

// --- CART FEATURES ---

// @desc    Get user cart
// @route   GET /api/auth/cart
const getCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).lean();
  res.json(cart ? cart.items : []);
});

// @desc    Update user cart
// @route   POST /api/auth/cart
const updateCart = asyncHandler(async (req, res, next) => {
  const { cartItems } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.items = cartItems;
    await cart.save();
  } else {
    cart = await Cart.create({ user: req.user._id, items: cartItems });
  }
  res.json(cart.items);
});

// @desc    Clear user cart
// @route   DELETE /api/cart
const clearCart = asyncHandler(async (req, res, next) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ message: 'Cart cleared successfully' });
});

// --- LOYALTY FEATURES ---

// @desc    Get loyalty status
// @route   GET /api/auth/loyalty
const getLoyaltyStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('loyaltyPoints loyaltyTier').lean();
  const transactions = await LoyaltyTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ ...user, transactions });
});

// @desc    Delete user account
// @route   DELETE /api/auth/delete
// @access  Private
const deleteUserAccount = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(400);
    throw new Error('User ID not found in request');
  }

  try {
    await Cart.findOneAndDelete({ user: userId });
    await LoyaltyTransaction.deleteMany({ user: userId });

    if (process.env.NODE_ENV === 'development') {
      await Order.deleteMany({ user: userId });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account and all associated data successfully deleted'
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500);
    throw new Error('Failed to delete account. Please try again.');
  }
});

// @desc    Forgot Password - Generate OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('No user found with that email address');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Set OTP and Expiry (10 minutes)
  user.resetPasswordOTP = otp;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  // For development: Log OTP to console
  console.log(`\n🔑 [PASSWORD RESET] OTP for ${email}: ${otp}\n`);

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email (simulated)'
  });
});

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Please provide email, OTP, and new password');
  }

  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  // Update password and clear OTP fields
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  console.log(`✅ Password successfully reset for user: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now log in.'
  });
});

// @desc    Change Password (Logged In)
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new password');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Incorrect current password');
  }

  // Set new password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Verify Staff Onboarding OTP
// @route   POST /api/auth/staff/verify-otp
// @access  Public
const verifyStaffOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp });

  if (!otpRecord) {
    res.status(401);
    throw new Error('Invalid or expired OTP');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('User account not found');
  }

  if (user.isOnboarded) {
    res.status(400);
    throw new Error('Account already setup. Please login normally.');
  }

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully. You can now set your password.'
  });
});

// @desc    Setup Staff Password and Activate Account
// @route   POST /api/auth/staff/setup-password
// @access  Public
const setupStaffPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    res.status(400);
    throw new Error('All fields are required');
  }

  // Double check OTP
  const otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp });
  if (!otpRecord) {
    res.status(401);
    throw new Error('Verification failed. Please try again.');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update password and status
  user.password = password;
  user.isOnboarded = true;
  user.isActive = true;
  await user.save();

  // Delete OTP
  await OTP.deleteOne({ _id: otpRecord._id });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Account setup successfully! You can now log in.',
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    token
  });
});

module.exports = {
  sendOTP,
  verifyOTP,
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  getCart,
  updateCart,
  getLoyaltyStatus,
  deleteUserAccount,
  clearCart,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyStaffOTP,
  setupStaffPassword
};
