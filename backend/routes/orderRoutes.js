const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrder, updateOrderStatus } = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createOrder);
router.route('/me').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrder);
router.route('/:id/status').put(protect, admin, updateOrderStatus);

module.exports = router;
