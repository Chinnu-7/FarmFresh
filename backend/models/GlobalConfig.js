const mongoose = require('mongoose');

const globalConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['delivery_settings', 'payment_settings', 'contact_settings'],
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('GlobalConfig', globalConfigSchema);
