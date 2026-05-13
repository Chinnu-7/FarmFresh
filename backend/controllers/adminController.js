const Order = require('../models/Order');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const DailyInventory = require('../models/DailyInventory');
const { startOfDay, subDays } = require('date-fns');

/**
 * @desc    Admin Dashboard Stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);

    const [
      totalUsers,
      totalOrders,
      activeSubscriptions,
      todayInventory,
      recentRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      DailyInventory.findOne({ date: today }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            paymentStatus: 'completed',
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Daily revenue for the last 7 days
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: subDays(today, 7) },
          paymentStatus: 'completed',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        activeSubscriptions,
        todayInventory,
        monthlyRevenue: recentRevenue[0]?.total || 0,
        dailyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .populate('items.product')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all subscriptions (Admin)
 * @route   GET /api/admin/subscriptions
 * @access  Private/Admin
 */
exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter)
      .populate('user', 'name phone')
      .populate('product')
      .sort('-createdAt');

    res.json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (Admin)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({ success: true, count: users.length, total, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Demand Prediction (basic algorithm)
 * @route   GET /api/admin/demand-prediction
 * @access  Private/Admin
 *
 * Uses a simple 7-day moving average of milk consumption
 * to predict tomorrow's demand.
 */
exports.demandPrediction = async (req, res, next) => {
  try {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);

    const history = await DailyInventory.find({
      date: { $gte: sevenDaysAgo, $lte: today },
    }).sort('date');

    if (history.length === 0) {
      return res.json({
        success: true,
        data: { predictedDemandLiters: 0, confidence: 'low', message: 'Not enough data' },
      });
    }

    const totalConsumed = history.reduce((sum, day) => {
      return sum + day.allocatedToSubscriptionsLiters + day.soldInstantLiters;
    }, 0);

    const avgDaily = totalConsumed / history.length;

    // Factor in subscription growth
    const activeSubscriptions = await Subscription.find({ status: 'active' });
    const subscriptionDemand = activeSubscriptions.reduce((sum, s) => sum + s.volumePerDayLiters, 0);

    const predicted = Math.max(avgDaily, subscriptionDemand * 1.2); // 20% buffer

    res.json({
      success: true,
      data: {
        predictedDemandLiters: Math.ceil(predicted),
        subscriptionBaseLiters: subscriptionDemand,
        avgDailyConsumptionLiters: Math.round(avgDaily * 10) / 10,
        confidence: history.length >= 7 ? 'high' : 'medium',
        daysOfData: history.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
