const express = require('express');
const router = express.Router();
const {
  createSubscription,
  getMySubscriptions,
  updateSubscriptionStatus,
  skipDates,
} = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createSubscription);
router.route('/me').get(protect, getMySubscriptions);
router.route('/:id/status').put(protect, updateSubscriptionStatus);
router.route('/:id/skip').put(protect, skipDates);

module.exports = router;
