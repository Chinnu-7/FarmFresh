const mongoose = require('mongoose');

const dailyInventorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  // Total liters procured from farms today
  totalMilkProcuredLiters: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  // Liters reserved for active subscriptions
  allocatedToSubscriptionsLiters: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  // Liters available for instant orders (auto-calculated)
  availableForInstantOrdersLiters: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  // Liters already sold via instant orders today
  soldInstantLiters: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Mushroom packets available
  totalMushroomPackets: {
    type: Number,
    default: 0,
    min: 0,
  },
  soldMushroomPackets: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Wastage tracking
  wastageLiters: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { timestamps: true });

dailyInventorySchema.pre('save', function (next) {
  this.availableForInstantOrdersLiters =
    this.totalMilkProcuredLiters - this.allocatedToSubscriptionsLiters - this.soldInstantLiters;
  if (this.availableForInstantOrdersLiters < 0) this.availableForInstantOrdersLiters = 0;
  next();
});



dailyInventorySchema.index({ date: 1 });

module.exports = mongoose.model('DailyInventory', dailyInventorySchema);
