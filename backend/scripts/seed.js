const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const User = require('../models/User');
const DailyInventory = require('../models/DailyInventory');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const products = [
  {
    name: 'Farm Fresh Buffalo Milk',
    description: 'Pure, raw buffalo milk collected daily at 4 AM. No preservatives added.',
    price: 85,
    unit: '1 Litre',
    volumeInLiters: 1,
    type: 'milk',
    category: 'Dairy',
    isSubscriptionAllowed: true,
    farmSource: "Raju's Farm",
  },
  {
    name: 'Fresh Milky Mushrooms',
    description: 'Premium quality milky mushrooms, freshly harvested and packed.',
    price: 50,
    unit: '200g Packet',
    volumeInLiters: 0,
    type: 'mushroom',
    category: 'Vegetables',
    isSubscriptionAllowed: false,
    farmSource: "FarmFresh Unit 1",
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data (optional, but good for fresh start)
    await Product.deleteMany({});
    // await User.deleteMany({}); // Uncomment if you want to clear users too
    // await DailyInventory.deleteMany({});

    // Add Products
    await Product.insertMany(products);
    console.log('✅ Products seeded successfully');

    // Create a default admin user if not exists
    const adminPhone = '9999999999';
    let admin = await User.findOne({ phone: adminPhone });
    if (!admin) {
      admin = await User.create({
        phone: adminPhone,
        name: 'Admin User',
        email: 'admin@farmfresh.com',
        role: 'admin'
      });
      console.log('✅ Default Admin created (Phone: 9999999999)');
    } else {
      admin.role = 'admin';
      await admin.save();
      console.log('✅ Existing user promoted to Admin');
    }

    console.log('Seeding completed! Press Ctrl+C to exit.');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
