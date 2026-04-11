/* eslint-env node */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db.js');
const User = require('../models/User.js');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const promoteUser = async () => {
  const email = process.argv[2];
  const role = process.argv[3] || 'admin';

  if (!email) {
    console.log('\nUsage: node promoteUser.js <email> [role]');
    console.log('Standard Roles: customer, admin, chef, rider\n');
    process.exit(1);
  }

  try {
    console.log(`\n🚀 Promoting User: ${email} to ${role}...`);
    
    // Use the shared connectDB utility for consistency
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ Error: User not found with email: ${email}`);
      console.log('💡 Tip: Make sure the user has registered via the website first.');
      process.exit(1);
    }

    user.role = role;
    await user.save();

    console.log(`\n✅ SUCCESS: User ${email} is now a(n) [${role}]`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Promotion Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

promoteUser();
