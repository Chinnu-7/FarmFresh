const Order = require('../models/Order');
const DailyInventory = require('../models/DailyInventory');
const Product = require('../models/Product');
const { startOfDay } = require('date-fns');

/**
 * @desc    Place an instant order
 * @route   POST /api/orders
 * @access  Private
 *
 * FIX #2: The original controller had a race condition — it checked availability
 * then deducted in two separate operations. Under concurrent load, two requests
 * could both pass the check and oversell. Now uses a single atomic
 * findOneAndUpdate with a conditional filter so the check and deduction happen
 * in one DB round-trip.
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { items, paymentMethod, address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }
    if (!address || !address.street) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    const today = startOfDay(new Date());
    const inventory = await DailyInventory.findOne({ date: today });
    if (!inventory) {
      return res.status(400).json({ success: false, message: 'Inventory not set for today. Orders cannot be accepted yet.' });
    }

    let totalAmount = 0;
    let requiredMilkLiters = 0;
    let requiredMushroomPackets = 0;
    const populatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }
      if (!product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${product.name} is currently unavailable` });
      }

      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;
      populatedItems.push({ product: product._id, quantity: item.quantity, price: product.price });

      if (product.type === 'milk') {
        requiredMilkLiters += item.quantity * product.volumeInLiters;
      } else if (product.type === 'mushroom') {
        requiredMushroomPackets += item.quantity;
      }
    }

    // FIX #2: Atomic inventory deduction using conditional findOneAndUpdate.
    // The filter ensures we only deduct if sufficient stock exists.
    // If the document doesn't match (stock exhausted mid-request), we return 400.
    if (requiredMilkLiters > 0) {
      const updated = await DailyInventory.findOneAndUpdate(
        {
          date: today,
          availableForInstantOrdersLiters: { $gte: requiredMilkLiters },
        },
        {
          $inc: {
            soldInstantLiters: requiredMilkLiters,
            availableForInstantOrdersLiters: -requiredMilkLiters,
          },
        },
        { new: true }
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Not enough milk available. Sold out for today!',
          availableLiters: inventory.availableForInstantOrdersLiters,
        });
      }
    }

    if (requiredMushroomPackets > 0) {
      const updated = await DailyInventory.findOneAndUpdate(
        {
          date: today,
          $expr: {
            $gte: [
              { $subtract: ["$totalMushroomPackets", "$soldMushroomPackets"] },
              requiredMushroomPackets
            ]
          }
        },
        { $inc: { soldMushroomPackets: requiredMushroomPackets } },
        { new: true }
      );

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Not enough mushrooms available. Sold out for today!',
        });
      }
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: populatedItems,
      type: 'instant',
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending',
      deliveryDate: today,
      address,
    });

    await order.populate('items.product');

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get my orders
 * @route   GET /api/orders/me
 * @access  Private
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort('-createdAt');
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Ensure user owns this order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (Admin/Delivery)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date(), note: note || '' });

    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'completed';
    }

    await order.save();
    await order.populate('items.product');

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
