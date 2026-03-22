const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors'); // Optional, if you have it
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

    console.log('Data Cleared...'.red || 'Data Cleared...');

    // Seed Categories
    const categories = await Category.insertMany([
      { name: 'Burgers', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&auto=format&fit=crop' },
      { name: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop' },
      { name: 'Drinks', image: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?w=800&auto=format&fit=crop' },
      { name: 'Food', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop' },
      { name: 'Sweets', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&auto=format&fit=crop' },
    ]);

    // Seed Admin User
    const adminUser = await User.create({
      clerkId: 'admin_clerk_id',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin',
    });

    // Seed Products
    const products = await Product.insertMany([
      {
        name: 'Classic Cheeseburger',
        price: 850,
        description: 'Juicy beef patty with melted cheddar, lettuce, tomato, and our secret sauce.',
        category: 'Burgers',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
        countInStock: 20,
        isBestSeller: true,
      },
      {
        name: 'BBQ Bacon Burger',
        price: 950,
        description: 'Beef patty topped with crispy bacon, onion rings, and smoky BBQ sauce.',
        category: 'Burgers',
        image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&auto=format&fit=crop',
        countInStock: 15,
      },
      {
        name: 'Margherita Pizza',
        price: 1200,
        description: 'Fresh mozzarella, basil, and tomato sauce on a thin, crispy crust.',
        category: 'Pizzas',
        image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&auto=format&fit=crop',
        countInStock: 10,
        isVegetarian: true,
      },
      {
        name: 'Pepperoni Feast',
        price: 1500,
        description: 'Loaded with double pepperoni and extra mozzarella cheese.',
        category: 'Pizzas',
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop',
        countInStock: 12,
        isBestSeller: true,
      },
      {
        name: 'Mint Margarita',
        price: 250,
        description: 'Refreshing blend of fresh mint, lime, and soda.',
        category: 'Drinks',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop',
        countInStock: 50,
      },
      {
        name: 'Iced Caramel Macchiato',
        price: 450,
        description: 'Freshly brewed espresso with caramel syrup and chilled milk over ice.',
        category: 'Drinks',
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop',
        countInStock: 30,
      },
      {
        name: 'Chicken Karahi',
        price: 550,
        description: 'Traditional Pakistani curry cooked with tomatoes, ginger, and green chilies.',
        category: 'Food',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop',
        countInStock: 20,
        isBestSeller: true,
      },
      {
        name: 'Mutton Biryani',
        price: 650,
        description: 'Fragrant basmati rice layered with tender spiced mutton and saffron.',
        category: 'Food',
        image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop',
        countInStock: 15,
      },
      {
        name: 'Gulab Jamun',
        price: 150,
        description: 'Deep-fried milk solids in warm rose-infused syrup (2 pieces).',
        category: 'Sweets',
        image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=800&auto=format&fit=crop',
        countInStock: 40,
        isVegetarian: true,
      },
      {
        name: 'Rasmalai',
        price: 180,
        description: 'Delicate paneer discs soaked in chilled saffron-infused milk.',
        category: 'Sweets',
        image: 'https://images.unsplash.com/photo-1621350024976-13a17e0b5774?w=800&auto=format&fit=crop',
        countInStock: 30,
        isVegetarian: true,
      },
    ]);

    // Seed Sample Order
    await Order.create({
      user: adminUser._id,
      orderItems: [
        {
          name: products[0].name,
          qty: 2,
          image: products[0].image,
          price: products[0].price,
          product: products[0]._id,
        },
      ],
      shippingAddress: {
        address: '123 Test St',
        city: 'Sample City',
        postalCode: '12345',
        country: 'TestLand',
      },
      paymentMethod: 'Cash',
      totalPrice: products[0].price * 2,
      isPaid: false,
      status: 'placed',
      orderNumber: 'ORD-12345',
    });

    console.log('Data Seeded Successfully!'.green || 'Data Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red || `Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
