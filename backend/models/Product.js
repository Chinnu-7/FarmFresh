const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: {
      values: ['milk', 'mushroom'],
      message: '{VALUE} is not a valid product type',
    },
    required: true,
  },
  unit: {
    type: String,
    required: [true, 'Product unit is required'],
  },
  /**
   * volumeInLiters: For milk products, the actual volume in liters.
   * E.g. 500ml = 0.5, 1L = 1, 2L = 2.
   * This is used for accurate inventory deduction instead of
   * the broken "quantity = liters" assumption.
   */
  volumeInLiters: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  isSubscriptionAllowed: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  farmSource: {
    type: String,
    default: 'FarmFresh Partner Farm',
  },
  packingTime: {
    type: String,
    default: '4:00 AM - 5:00 AM',
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
