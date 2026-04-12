const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Reservation = require('../models/Reservation');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({});
  const totalOrders = await Order.countDocuments({});
  const totalProducts = await Product.countDocuments({});
  const totalReservations = await Reservation.countDocuments({});
  
  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'firstName lastName')
    .lean();

  const totalRevenueResult = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: { $subtract: ['$totalPrice', { $ifNull: ['$taxPrice', 0] }] } } } }
  ]);
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

  // Get order statistics
  const orderStatsResult = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Get popular items
  const popularItemsResult = await Order.aggregate([
    { $unwind: '$orderItems' },
    { $group: { 
        _id: '$orderItems.name', 
        totalSold: { $sum: '$orderItems.qty' } 
      } 
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    totalUsers,
    totalOrders,
    totalProducts,
    totalReservations,
    totalRevenue,
    totalSales: totalRevenue, // Alias for frontend compatibility
    recentOrders,
    orderStats: orderStatsResult,
    popularItems: popularItemsResult
  });
});

// @desc    Get all users for management
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).lean();
  res.json(users);
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);

  if (user) {
    user.role = role;
    await user.save();
    res.json({ message: `User role updated to ${role}` });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = { getAdminStats, getAllUsers, updateUserRole };
