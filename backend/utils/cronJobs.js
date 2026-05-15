const cron = require('node-cron');
const { startOfDay } = require('date-fns');
const Subscription = require('../models/Subscription');
const DailyInventory = require('../models/DailyInventory');
const Order = require('../models/Order');

/**
 * The core logic for daily subscription allocation.
 * Can be run by cron OR manually (on server start recovery).
 */
const performDailyAllocation = async (date = new Date()) => {
  const targetDate = startOfDay(date);
  console.log(`[JOBS] Running subscription allocation for ${targetDate.toDateString()}...`);
  
  try {
    const subscriptions = await Subscription.find({ status: 'active' }).populate('product');

    let totalLitersNeeded = 0;
    const fulfilledSubs = [];

    for (const sub of subscriptions) {
      if (!sub.product) {
        console.warn(`[JOBS] Skipping sub ${sub._id}: Product is missing or deleted`);
        continue;
      }

      const isSkipping = sub.skipDates.some(
        (d) => startOfDay(new Date(d)).getTime() === targetDate.getTime()
      );

      if (!isSkipping) {
        totalLitersNeeded += sub.volumePerDayLiters;
        fulfilledSubs.push(sub);
      }
    }

    for (const sub of fulfilledSubs) {
      const existingOrder = await Order.findOne({
        user: sub.user,
        type: 'subscription-fulfillment',
        deliveryDate: targetDate,
        'items.0.product': sub.product._id,
      });

      if (!existingOrder) {
        // FIX #BUG: Actually deduct from wallet! 
        const User = require('../models/User');
        const totalAmount = sub.product.price * sub.quantityPerDay;
        const updatedUser = await User.deductWallet(sub.user, totalAmount);
        
        const paymentStatus = updatedUser ? 'completed' : 'pending';

        await Order.create({
          user: sub.user,
          items: [{
            product: sub.product._id,
            quantity: sub.quantityPerDay,
            price: sub.product.price,
          }],
          type: 'subscription-fulfillment',
          totalAmount,
          paymentMethod: 'wallet',
          paymentStatus,
          deliveryDate: targetDate,
          address: sub.deliveryAddress || {},
        });

        if (!updatedUser) {
          console.warn(`[JOBS] Subscription order created for user ${sub.user} with PENDING payment due to insufficient balance.`);
        }
      }
    }

    // Update inventory
    let inventory = await DailyInventory.findOne({ date: targetDate });
    if (!inventory) {
      inventory = new DailyInventory({ date: targetDate });
    }
    inventory.allocatedToSubscriptionsLiters = totalLitersNeeded;
    await inventory.save();

    console.log(`[JOBS] Done. ${fulfilledSubs.length} subscriptions fulfilled. ${totalLitersNeeded}L allocated.`);
    return true;
  } catch (error) {
    console.error('[JOBS] Error in daily allocation:', error);
    return false;
  }
};

const runCronJobs = () => {
  cron.schedule('1 0 * * *', async () => {
    await performDailyAllocation();
  });

  console.log('[CRON] Daily allocation job scheduled for 00:01');
};

module.exports = {
  runCronJobs,
  performDailyAllocation
};
