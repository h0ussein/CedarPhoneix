import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/model/User.js';
import conn from '../config/db.js';

dotenv.config();

const createAdminUser = async () => {
  try {
    await conn();

    console.log('🔍 Checking for existing admin...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@seein.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Deleting old one...');
      await User.deleteOne({ email: 'admin@seein.com' });
    }

    // Create new admin user (password will be hashed automatically)
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@seein.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1234567890'
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: admin@seein.com');
    console.log('   Password: admin123');
    console.log('\n🔐 Password has been hashed and stored securely.');
    console.log('\n🚀 You can now login at: http://localhost:5173/admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();

