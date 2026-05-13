const mongoose = require('mongoose');
const crypto = require('crypto');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderNumber: {
    type: String,
    unique: true,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  }],
  type: {
    type: String,
    enum: ['instant', 'subscription-fulfillment'],
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed',
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod', 'wallet'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  deliveryDate: {
    type: Date,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// FIX #8: Auto-generate order number — crypto random to avoid race conditions.
// Old approach (countDocuments+1) was non-atomic and crashed under concurrent load.
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.orderNumber = `FF-${date}-${suffix}`;
  }
  next();
});

// Add initial status to statusHistory
orderSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory = [{ status: 'placed', timestamp: new Date() }];
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ deliveryDate: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
