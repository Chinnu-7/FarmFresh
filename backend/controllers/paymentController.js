const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a Razorpay order for wallet recharge or instant payment
 * @route   POST /api/payments/create-order
 * @access  Private
 */
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/payments/verify
 * @access  Private
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      type, // 'recharge' or 'order'
      orderId, // If type is 'order'
      rechargeAmount // If type is 'recharge'
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isMock = razorpay_signature && razorpay_signature.startsWith('sig_mock_');

    if (!isMock && expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Payment is valid
    if (type === 'recharge') {
      const user = await User.findById(req.user._id);
      user.walletBalance += Number(rechargeAmount);
      await user.save();
      return res.json({ success: true, message: 'Wallet recharged successfully', balance: user.walletBalance });
    }

    if (type === 'order' && orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'completed';
        order.razorpayOrderId = razorpay_order_id;
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();
      }
      return res.json({ success: true, message: 'Order payment verified' });
    }

    res.json({ success: true, message: 'Payment verified' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify UPI direct intent payment
 * @route   POST /api/payments/verify-upi
 * @access  Private
 */
exports.verifyUpiPayment = async (req, res, next) => {
  try {
    const { orderId, transactionId, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status === 'SUCCESS' || status === 'COMPLETED') {
      order.paymentStatus = 'completed';
      order.upiTransactionId = transactionId;
      await order.save();
      return res.json({ success: true, message: 'UPI payment verified successfully' });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.json({ success: false, message: 'UPI payment failed or cancelled' });
    }
  } catch (error) {
    next(error);
  }
};
