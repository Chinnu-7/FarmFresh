const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const User = require('../models/User');
const DailyInventory = require('../models/DailyInventory');
const Subscription = require('../models/Subscription');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const products = [
  {
    name: 'PureDudh Buffalo Milk',
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
    farmSource: "PureDudh Unit 1",
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Product.deleteMany({});
    await Subscription.deleteMany({});
    // await User.deleteMany({});
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
        email: 'admin@puredudh.com',
        role: 'admin'
      });
      console.log('✅ Default Admin created (Phone: 9999999999)');
    } else {
      admin.role = 'admin';
      await admin.save();
      console.log('✅ Existing user promoted to Admin');
    }

    // Seed Global Config
    const GlobalConfig = require('../models/GlobalConfig');
    await GlobalConfig.deleteMany();
    await GlobalConfig.insertMany([
      {
        key: 'delivery_settings',
        value: {
          slots: ['5 AM - 8 AM', '8 AM - 11 AM'],
          minOrderValue: 100,
          freeDeliveryThreshold: 500,
          deliveryFee: 30,
        }
      },
      {
        key: 'payment_settings',
        value: {
          razorpayEnabled: true,
          codEnabled: true,
          walletEnabled: true,
          minWalletRecharge: 100,
        }
      },
      {
        key: 'contact_settings',
        value: {
          supportPhone: '+91 8106271906',
          supportEmail: 'support@puredudh.com',
          officeAddress: 'Champapet, Hyderabad, India',
        }
      }
    ]);
    console.log('✅ Global configuration seeded');

    console.log('Seeding completed! Press Ctrl+C to exit.');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
