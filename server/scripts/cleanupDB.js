/* eslint-env node */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db.js');

// Import Models
const User = require('../models/User.js');
const Product = require('../models/Product.js');
const Order = require('../models/Order.js');
const Category = require('../models/Category.js');
const Deal = require('../models/Deal.js');
const Cart = require('../models/Cart.js');
const Reservation = require('../models/Reservation.js');
const LoyaltyTransaction = require('../models/Loyalty.js');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cleanupDB = async () => {
  try {
    console.log('\n🧹 Starting System-Wide Database Cleanup...');
    
    // Use the shared connectDB utility for consistency
    await connectDB();
    
    // 1. Remove specific test users
    const testEmails = ['admin@ak7.com', 'chef@ak7.com', 'rider@ak7.com', 'customer@ak7.com'];
    const userResult = await User.deleteMany({ email: { $in: testEmails } });
    console.log(`  🗑️  Removed ${userResult.deletedCount} specific test users.`);

    // 2. Clear all transactional and product data
    const results = await Promise.all([
      Product.deleteMany({}),
      Order.deleteMany({}),
      Category.deleteMany({}),
      Deal.deleteMany({}),
      Reservation.deleteMany({}),
      LoyaltyTransaction.deleteMany({}),
      Cart.deleteMany({})
    ]);

    console.log(`  🗑️  Removed ${results[0].deletedCount} products.`);
    console.log(`  🗑️  Removed ${results[1].deletedCount} orders.`);
    console.log(`  🗑️  Removed ${results[2].deletedCount} categories.`);
    console.log(`  🗑️  Removed ${results[3].deletedCount} deals.`);
    console.log(`  🗑️  Removed ${results[4].deletedCount} reservations.`);
    console.log(`  🗑️  Removed ${results[5].deletedCount} loyalty entries.`);
    console.log(`  🗑️  Cleared ${results[6].deletedCount} active carts.`);

    console.log('\n✨ Database is now CLEAN and production-ready.');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

cleanupDB();
