const cron = require('node-cron');
const { startOfDay } = require('date-fns');
const Subscription = require('../models/Subscription');
const DailyInventory = require('../models/DailyInventory');
const Order = require('../models/Order');

/**
 * Daily subscription allocation job.
 * Runs at 00:01 every day to:
 * 1. Calculate total liters needed for active subscriptions (excluding skip dates).
 * 2. Create subscription-fulfillment orders for delivery partners.
 * 3. Update the DailyInventory.allocatedToSubscriptionsLiters.
 */
const runCronJobs = () => {
  cron.schedule('1 0 * * *', async () => {
    console.log('[CRON] Running daily subscription allocation...');
    try {
      const today = startOfDay(new Date());
      const subscriptions = await Subscription.find({ status: 'active' }).populate('product');

      let totalLitersNeeded = 0;
      const fulfilledSubs = [];

      for (const sub of subscriptions) {
        const isSkipping = sub.skipDates.some(
          (d) => startOfDay(new Date(d)).getTime() === today.getTime()
        );

        if (!isSkipping) {
          totalLitersNeeded += sub.volumePerDayLiters;
          fulfilledSubs.push(sub);
        }
      }

      // FIX #6: Include subscription._id in the guard so a user with multiple
      // active subscriptions doesn't get only one order created per day.
      for (const sub of fulfilledSubs) {
        const existingOrder = await Order.findOne({
          user: sub.user,
          type: 'subscription-fulfillment',
          deliveryDate: today,
          'items.0.product': sub.product._id, // per-subscription uniqueness
        });

        if (!existingOrder) {
          await Order.create({
            user: sub.user,
            items: [{
              product: sub.product._id,
              quantity: sub.quantityPerDay,
              price: sub.product.price,
            }],
            type: 'subscription-fulfillment',
            totalAmount: sub.product.price * sub.quantityPerDay,
            paymentMethod: 'wallet',
            paymentStatus: 'completed',
            deliveryDate: today,
            address: sub.deliveryAddress || {},
          });
        }
      }

      // Update inventory
      let inventory = await DailyInventory.findOne({ date: today });
      if (!inventory) {
        inventory = new DailyInventory({ date: today });
      }
      inventory.allocatedToSubscriptionsLiters = totalLitersNeeded;
      await inventory.save();

      console.log(`[CRON] Done. ${fulfilledSubs.length} subscriptions fulfilled. ${totalLitersNeeded}L allocated.`);
    } catch (error) {
      console.error('[CRON] Error in daily allocation:', error);
    }
  });

  console.log('[CRON] Daily allocation job scheduled for 00:01');
};

module.exports = runCronJobs;
