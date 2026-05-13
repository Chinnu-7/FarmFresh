const DailyInventory = require('../models/DailyInventory');
const Subscription = require('../models/Subscription');
const { startOfDay } = require('date-fns');

/**
 * @desc    Get today's inventory
 * @route   GET /api/inventory/today
 * @access  Public
 */
exports.getTodayInventory = async (req, res, next) => {
  try {
    const today = startOfDay(new Date());
    let inventory = await DailyInventory.findOne({ date: today });

    if (!inventory) {
      inventory = await DailyInventory.create({ date: today });
    }

    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update today's inventory (Admin sets daily procurement)
 * @route   PUT /api/inventory/today
 * @access  Private/Admin
 */
exports.updateTodayInventory = async (req, res, next) => {
  try {
    const { totalMilkProcuredLiters, totalMushroomPackets, wastageLiters } = req.body;
    const today = startOfDay(new Date());

    let inventory = await DailyInventory.findOne({ date: today });
    if (!inventory) {
      inventory = new DailyInventory({ date: today });
    }

    if (totalMilkProcuredLiters !== undefined) inventory.totalMilkProcuredLiters = totalMilkProcuredLiters;
    if (totalMushroomPackets !== undefined) inventory.totalMushroomPackets = totalMushroomPackets;
    if (wastageLiters !== undefined) inventory.wastageLiters = wastageLiters;

    await inventory.save(); // pre-save hook recalculates availableForInstantOrdersLiters

    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inventory history (Admin analytics)
 * @route   GET /api/inventory/history
 * @access  Private/Admin
 */
exports.getInventoryHistory = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const history = await DailyInventory.find({ date: { $gte: startOfDay(since) } })
      .sort('-date')
      .limit(parseInt(days));

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger daily allocation calculation (Admin manual trigger)
 * @route   POST /api/inventory/allocate
 * @access  Private/Admin
 */
exports.triggerAllocation = async (req, res, next) => {
  try {
    const today = startOfDay(new Date());

    const subscriptions = await Subscription.find({ status: 'active' });
    let totalLitersNeeded = 0;

    for (const sub of subscriptions) {
      const isSkipping = sub.skipDates.some(
        (d) => startOfDay(new Date(d)).getTime() === today.getTime()
      );
      if (!isSkipping) {
        totalLitersNeeded += sub.volumePerDayLiters;
      }
    }

    let inventory = await DailyInventory.findOne({ date: today });
    if (!inventory) {
      inventory = new DailyInventory({ date: today });
    }

    inventory.allocatedToSubscriptionsLiters = totalLitersNeeded;
    await inventory.save();

    res.json({
      success: true,
      message: `Allocated ${totalLitersNeeded}L for ${subscriptions.length} subscriptions`,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};
