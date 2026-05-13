const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

module.exports = router;
