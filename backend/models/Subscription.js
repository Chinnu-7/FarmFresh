const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantityPerDay: {
    type: Number,
    required: [true, 'Quantity per day is required'],
    min: [1, 'Minimum 1 unit per day'],
    max: [10, 'Maximum 10 units per day'],
  },
  /**
   * volumePerDayLiters: Pre-calculated total liters per day.
   * quantityPerDay * product.volumeInLiters.
   * Stored for fast cron job aggregation without needing to populate product.
   */
  volumePerDayLiters: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active',
  },
  skipDates: [{
    type: Date,
  }],
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  deliverySlot: {
    type: String,
    enum: ['5 AM - 8 AM'],
    default: '5 AM - 8 AM',
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
}, { timestamps: true });

// Compound index: one active subscription per user per product
subscriptionSchema.index({ user: 1, product: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
