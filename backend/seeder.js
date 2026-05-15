require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const DailyInventory = require('./models/DailyInventory');
const User = require('./models/User');
const Subscription = require('./models/Subscription');
const GlobalConfig = require('./models/GlobalConfig');
const { startOfDay } = require('date-fns');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Product.deleteMany();
    await DailyInventory.deleteMany();
    await Subscription.deleteMany();
    await GlobalConfig.deleteMany();

    console.log('Cleared existing products, inventory, and subscriptions.');

    // Seed Global Config
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

    // Create products
    const products = await Product.insertMany([
      {
        name: 'Fresh Buffalo Milk - 500ml',
        description: 'Pure, unadulterated buffalo milk. No preservatives. Packed fresh every morning at 4 AM.',
        type: 'milk',
        unit: '500ml',
        volumeInLiters: 0.5,
        price: 42,
        isSubscriptionAllowed: true,
        farmSource: 'Raju\'s Buffalo Farm, Anantapur',
        packingTime: '4:00 AM - 4:30 AM',
      },
      {
        name: 'Fresh Buffalo Milk - 1L',
        description: 'Pure, unadulterated buffalo milk. No preservatives. Packed fresh every morning at 4 AM.',
        type: 'milk',
        unit: '1 Litre',
        volumeInLiters: 1,
        price: 80,
        isSubscriptionAllowed: true,
        farmSource: 'Raju\'s Buffalo Farm, Anantapur',
        packingTime: '4:00 AM - 4:30 AM',
      },
      {
        name: 'Fresh Buffalo Milk - 2L',
        description: 'Pure, unadulterated buffalo milk. Family pack. No preservatives.',
        type: 'milk',
        unit: '2 Litres',
        volumeInLiters: 2,
        price: 155,
        isSubscriptionAllowed: true,
        farmSource: 'Raju\'s Buffalo Farm, Anantapur',
        packingTime: '4:00 AM - 4:30 AM',
      },
      {
        name: 'Button Mushrooms',
        description: 'Freshly harvested white button mushrooms. Farm-to-door within 6 hours.',
        type: 'mushroom',
        unit: '200g pack',
        volumeInLiters: 0,
        price: 60,
        isSubscriptionAllowed: false,
        farmSource: 'GreenGrow Mushroom Farm, Kurnool',
        packingTime: '5:00 AM - 5:30 AM',
      },
      {
        name: 'Oyster Mushrooms',
        description: 'Premium oyster mushrooms. Rich in protein and antioxidants.',
        type: 'mushroom',
        unit: '200g pack',
        volumeInLiters: 0,
        price: 75,
        isSubscriptionAllowed: false,
        farmSource: 'GreenGrow Mushroom Farm, Kurnool',
        packingTime: '5:00 AM - 5:30 AM',
      },
    ]);

    console.log(`Created ${products.length} products.`);

    // Create today's inventory
    const today = startOfDay(new Date());
    await DailyInventory.create({
      date: today,
      totalMilkProcuredLiters: 500,
      allocatedToSubscriptionsLiters: 0,
      soldInstantLiters: 0,
      totalMushroomPackets: 50,
      soldMushroomPackets: 0,
    });

    console.log('Created today\'s inventory (500L milk, 50 mushroom packets).');

    // Upsert admin user — always ensures role is 'admin'
    const adminUser = await User.findOneAndUpdate(
      { phone: '9999999999' },
      { $set: { name: 'Admin', role: 'admin' } },
      { upsert: true, new: true }
    );
    console.log(`Admin user ensured (phone: 9999999999, role: ${adminUser.role})`);

    // Upsert test customer
    const testUser = await User.findOneAndUpdate(
      { phone: '8888888888' },
      {
        $set: {
          name: 'Test Customer',
          role: 'customer',
          addresses: [{
            label: 'Home',
            street: '123 Farm Road',
            city: 'Hyderabad',
            state: 'Telangana',
            zipCode: '500001',
            isDefault: true,
          }],
        },
      },
      { upsert: true, new: true }
    );
    console.log(`Test customer ensured (phone: 8888888888, role: ${testUser.role})`);

    console.log('\n✅ Seed completed successfully!');
    console.log('Admin login: 9999999999 (OTP: 123456)');
    console.log('Customer login: 8888888888 (OTP: 123456)');
    process.exit();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
