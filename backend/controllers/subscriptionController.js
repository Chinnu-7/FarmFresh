const Subscription = require('../models/Subscription');
const Product = require('../models/Product');
const DailyInventory = require('../models/DailyInventory');
const { startOfDay } = require('date-fns');

/**
 * @desc    Create a subscription
 * @route   POST /api/subscriptions
 * @access  Private
 */
exports.createSubscription = async (req, res, next) => {
  try {
    const { productId, quantityPerDay, deliverySlot, deliveryAddress } = req.body;

    if (!productId || !quantityPerDay) {
      return res.status(400).json({ success: false, message: 'productId and quantityPerDay are required' });
    }

    // Verify product exists and allows subscription
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (!product.isSubscriptionAllowed) {
      return res.status(400).json({ success: false, message: 'This product does not support subscriptions' });
    }

    // Check for existing active subscription
    const existing = await Subscription.findOne({
      user: req.user._id,
      product: productId,
      status: 'active',
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active subscription for this product' });
    }

    // Calculate actual volume in liters
    const volumePerDayLiters = quantityPerDay * product.volumeInLiters;

    const subscription = await Subscription.create({
      user: req.user._id,
      product: productId,
      quantityPerDay,
      volumePerDayLiters,
      deliverySlot,
      deliveryAddress: deliveryAddress || (req.user.addresses.find(a => a.isDefault) || req.user.addresses[0]),
    });

    // Update today's inventory allocation
    const today = startOfDay(new Date());
    await DailyInventory.findOneAndUpdate(
      { date: today },
      { $inc: { allocatedToSubscriptionsLiters: volumePerDayLiters } },
      { upsert: true, new: true }
    );

    const populated = await subscription.populate('product');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get my subscriptions
 * @route   GET /api/subscriptions/me
 * @access  Private
 */
exports.getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .populate('product')
      .sort('-createdAt');
    res.json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pause / Resume / Cancel subscription
 * @route   PUT /api/subscriptions/:id/status
 * @access  Private
 */
exports.updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be active, paused, or cancelled' });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this subscription' });
    }

    const oldStatus = subscription.status;
    if (oldStatus === status) {
      return res.status(400).json({ success: false, message: `Subscription is already ${status}` });
    }

    // Adjust today's inventory allocation
    const today = startOfDay(new Date());
    if (oldStatus === 'active' && (status === 'paused' || status === 'cancelled')) {
      await DailyInventory.findOneAndUpdate(
        { date: today },
        { $inc: { allocatedToSubscriptionsLiters: -subscription.volumePerDayLiters } }
      );
    } else if ((oldStatus === 'paused') && status === 'active') {
      await DailyInventory.findOneAndUpdate(
        { date: today },
        { $inc: { allocatedToSubscriptionsLiters: subscription.volumePerDayLiters } },
        { upsert: true }
      );
    }

    subscription.status = status;
    await subscription.save();
    await subscription.populate('product');

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Skip specific dates for a subscription
 * @route   PUT /api/subscriptions/:id/skip
 * @access  Private
 */
exports.skipDates = async (req, res, next) => {
  try {
    const { dates } = req.body; // array of date strings e.g. ['2026-04-25', '2026-04-26']

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of dates to skip' });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Add new dates, avoiding duplicates
    const existingDates = new Set(subscription.skipDates.map(d => d.toISOString().split('T')[0]));
    for (const d of dates) {
      if (!existingDates.has(d)) {
        subscription.skipDates.push(new Date(d));
      }
    }

    await subscription.save();
    await subscription.populate('product');

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};
