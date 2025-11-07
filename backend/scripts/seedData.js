import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/model/Product.js';
import Category from '../src/model/Category.js';
import User from '../src/model/User.js';
import conn from '../config/db.js';

dotenv.config();

const categories = [
  { name: 'Electronics', description: 'Latest gadgets and electronic devices' },
  { name: 'Fashion', description: 'Trendy clothing and accessories' },
  { name: 'Home & Garden', description: 'Everything for your home' },
  { name: 'Sports', description: 'Sports equipment and gear' },
  { name: 'Books', description: 'Books and educational materials' },
  { name: 'Toys', description: 'Toys and games for all ages' },
  { name: 'Beauty', description: 'Beauty and personal care products' },
  { name: 'Automotive', description: 'Car parts and accessories' }
];

const products = [
  {
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
    price: 99.99,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    featured: true,
    rating: 4.5,
    numReviews: 128
  },
  {
    name: 'Smart Watch',
    description: 'Advanced fitness tracking and smart notifications',
    price: 199.99,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    featured: true,
    rating: 4.7,
    numReviews: 95
  },
  {
    name: 'Running Shoes',
    description: 'Comfortable cushioned running shoes for long-distance',
    price: 79.99,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    featured: false,
    rating: 4.3,
    numReviews: 210
  },
  {
    name: 'Laptop Backpack',
    description: 'Water-resistant backpack with laptop compartment',
    price: 49.99,
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    featured: false,
    rating: 4.6,
    numReviews: 87
  },
  {
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with thermal carafe',
    price: 129.99,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
    featured: true,
    rating: 4.4,
    numReviews: 156
  },
  {
    name: 'Yoga Mat',
    description: 'Extra thick non-slip exercise mat',
    price: 29.99,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    featured: false,
    rating: 4.8,
    numReviews: 342
  }
];

const users = [
  {
    name: 'Admin User',
    email: 'admin@seein.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567890'
  },
  {
    name: 'Test User',
    email: 'user@seein.com',
    password: 'user123',
    role: 'user',
    phone: '+1234567891'
  }
];

const seedDatabase = async () => {
  try {
    await conn();

    // Clear existing data
    console.log('Clearing existing data...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    // Seed categories
    console.log('Seeding categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Seed products with category references
    console.log('Seeding products...');
    const productsWithCategories = products.map((product, index) => ({
      ...product,
      category: createdCategories[index % createdCategories.length]._id
    }));
    const createdProducts = await Product.insertMany(productsWithCategories);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Seed users
    console.log('Seeding users...');
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@seein.com / admin123');
    console.log('User: user@seein.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

