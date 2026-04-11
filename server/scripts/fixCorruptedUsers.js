/* eslint-env node */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db.js');
const User = require('../models/User.js');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fixCorruptedUsers = async () => {
  try {
    console.log('\n🔧 Starting database integrity check...');
    
    // Use the shared connectDB utility for consistency
    await connectDB();
    
    // Step 1: Find all users
    const allUsers = await User.find().lean();
    console.log(`📊 Found ${allUsers.length} total users in database`);

    // Step 2: Identify corrupted users
    const corruptedUsers = [];
    const validUsers = [];

    for (const user of allUsers) {
      if (!user.password || typeof user.password !== 'string' || user.password.length < 10) {
        // Most bcrypt hashes are ~60 characters. A very short string is likely a plain text or corrupted entry.
        corruptedUsers.push({
          email: user.email,
          reason: !user.password ? 'Missing password' : 'Invalid hash format'
        });
      } else {
        validUsers.push(user.email);
      }
    }

    console.log(`✅ Valid users: ${validUsers.length}`);
    console.log(`❌ Corrupted users: ${corruptedUsers.length}`);

    if (corruptedUsers.length > 0) {
      console.log('\n🔍 Corrupted records identified:');
      for (const u of corruptedUsers) {
        console.log(`  - ${u.email} [${u.reason}]`);
        await User.deleteOne({ email: u.email });
        console.log(`    ✓ Deleted`);
      }
    } else {
      console.log('\n✅ No corrupted users found.');
    }

    console.log('\n✅ Database repair completed successfully!');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Repair Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

fixCorruptedUsers();
