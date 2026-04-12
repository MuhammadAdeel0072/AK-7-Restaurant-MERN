const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const LoyaltyTransaction = require('../models/Loyalty');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
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

// @desc    Authenticate user & get token
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

  const { firstName, lastName, phoneNumber, addresses, avatar, password, favorites } = req.body;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (avatar !== undefined) user.avatar = avatar;

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

module.exports = {
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
  resetPassword
};

