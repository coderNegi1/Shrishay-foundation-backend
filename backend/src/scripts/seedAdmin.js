/**
 * Seed Admin Script
 * Creates the initial admin user for the system
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'admin@shrishay.org' 
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@shrishay.org',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      name: 'System Administrator',
      role: 'admin',
      isActive: true
    };

    const admin = await User.create(adminData);
    
    console.log('✅ Admin user created successfully');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', adminData.password);
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Run the seed script
seedAdmin();
