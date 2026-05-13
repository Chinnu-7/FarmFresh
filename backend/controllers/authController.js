const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

/**
 * In-memory OTP store for development.
 * In production: replace with Redis with a TTL of 5 minutes.
 * Format: { [phone]: { otp: string, expiresAt: Date } }
 */
const otpStore = new Map();

/**
 * @desc    Request OTP (Mocked for dev, integrate SMS gateway for production)
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Validate Indian mobile number format
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number' });
    }

    // Generate OTP: static in dev, cryptographically random in production
    const otp = process.env.NODE_ENV === 'production'
      ? String(Math.floor(100000 + crypto.randomInt(900000)))
      : '123456';

    // Store OTP with a 5-minute expiry
    otpStore.set(phone, {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[DEV] OTP for ${phone}: ${otp}`);

    // TODO: In production, send via Fast2SMS / Twilio here
    // await smsService.send(phone, `Your FarmFresh OTP is ${otp}. Valid for 5 minutes.`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP & Login/Register
 * @route   POST /api/auth/verify-otp
 * @access  Public
 *
 * FIX #4: Previously always compared against hardcoded '123456' even in
 * production. Now verifies against the stored OTP with expiry check.
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const stored = otpStore.get(phone);

    if (!stored) {
      return res.status(401).json({ success: false, message: 'OTP not found. Please request a new one.' });
    }

    if (new Date() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(401).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (otp !== stored.otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP is valid — consume it (one-time use)
    otpStore.delete(phone);

    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ phone });
      isNewUser = true;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      isNewUser,
      data: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        walletBalance: user.walletBalance,
        addresses: user.addresses,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, addresses } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (addresses !== undefined) update.addresses = addresses;

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
