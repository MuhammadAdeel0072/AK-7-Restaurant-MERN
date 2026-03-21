const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Middleware to protect routes and attach user to request
const protect = asyncHandler(async (req, res, next) => {
  const clerkUser = req.auth;

  if (!clerkUser) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  // Find user in our database by clerkId
  let user = await User.findOne({ clerkId: clerkUser.userId }).lean();

  if (!user) {
    res.status(401);
    throw new Error('User not found in database');
  }

  req.user = user;
  next();
});

module.exports = { protect, ClerkExpressRequireAuth };
