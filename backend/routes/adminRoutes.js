const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllOrders,
  getAllSubscriptions,
  getAllUsers,
  demandPrediction,
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect, admin); // All admin routes require auth + admin role

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.get('/subscriptions', getAllSubscriptions);
router.get('/users', getAllUsers);
router.get('/demand-prediction', demandPrediction);

module.exports = router;
