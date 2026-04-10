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
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: 'customer', 
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile (Self)
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
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
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { firstName, lastName, phoneNumber, addresses, avatar, password } = req.body;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (avatar !== undefined) user.avatar = avatar;
  
  if (addresses !== undefined) user.addresses = addresses;
  
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
    token: generateToken(updated._id),
  });
});

// --- CART FEATURES ---

// @desc    Get user cart
// @route   GET /api/auth/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).lean();
  res.json(cart ? cart.items : []);
});

// @desc    Update user cart
// @route   POST /api/auth/cart
const updateCart = asyncHandler(async (req, res) => {
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

// --- LOYALTY FEATURES ---

// @desc    Get loyalty status
// @route   GET /api/auth/loyalty
const getLoyaltyStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('loyaltyPoints loyaltyTier').lean();
  const transactions = await LoyaltyTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ ...user, transactions });
});

// @desc    Delete user account
// @route   DELETE /api/auth/delete
// @access  Private
const deleteUserAccount = asyncHandler(async (req, res) => {
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

module.exports = { 
  registerUser, 
  authUser, 
  getUserProfile, 
  updateUserProfile, 
  getCart, 
  updateCart, 
  getLoyaltyStatus, 
  deleteUserAccount 
};

