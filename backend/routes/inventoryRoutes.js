const express = require('express');
const router = express.Router();
const {
  getTodayInventory,
  updateTodayInventory,
  getInventoryHistory,
  triggerAllocation,
} = require('../controllers/inventoryController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/today')
  .get(getTodayInventory)
  .put(protect, admin, updateTodayInventory);

router.route('/history').get(protect, admin, getInventoryHistory);
router.route('/allocate').post(protect, admin, triggerAllocation);

module.exports = router;
