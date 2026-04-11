/* eslint-env node */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db.js');
const User = require('../models/User.js');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedBaseline = async () => {
  try {
    console.log('\n🌱 Seeding Baseline Accounts (Admin, Chef, Rider)...');
    
    await connectDB();

    const baselineUsers = [
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@ak7.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        firstName: 'Master',
        lastName: 'Chef',
        email: 'chef@ak7.com',
        password: 'chef123',
        role: 'chef'
      },
      {
        firstName: 'Fast',
        lastName: 'Rider',
        email: 'rider@ak7.com',
        password: 'rider123',
        role: 'rider'
      }
    ];

    for (const userData of baselineUsers) {
      const userExists = await User.findOne({ email: userData.email });
      
      if (userExists) {
        console.log(`  ⚠️  User ${userData.email} already exists. Skipping.`);
        continue;
      }

      await User.create(userData);
      console.log(`  ✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n✨ Baseline Seeding Complete!');
    console.log('📝 Use these credentials to log in:');
    console.log('   - Admin: admin@ak7.com / admin123');
    console.log('   - Chef:  chef@ak7.com / chef123');
    console.log('   - Rider: rider@ak7.com / rider123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedBaseline();
