const DailyInventory = require('../models/DailyInventory');
const { startOfDay } = require('date-fns');

/**
 * Smart Pricing Engine (ML-Lite)
 * Adjusts product prices based on real-time inventory levels and demand patterns.
 * 
 * Logic:
 * 1. Scarcity Surge: If available stock < 15%, increase price by 10%.
 * 2. High Availability: If stock > 85% and it's after 6 PM, decrease price by 15% (Clearance).
 * 3. Default: Return base price.
 */
exports.calculateSmartPrice = async (product, inventory) => {
  if (!product) return 0;
  
  let basePrice = product.price;
  let finalPrice = basePrice;
  const now = new Date();
  const currentHour = now.getHours();

  // If inventory wasn't passed, try to fetch today's inventory
  if (!inventory) {
    const today = startOfDay(now);
    inventory = await DailyInventory.findOne({ date: today });
  }

  if (!inventory) return basePrice;

  if (product.type === 'milk') {
    const availabilityRatio = inventory.availableForInstantOrdersLiters / inventory.totalMilkProcuredLiters;
    
    // Scarcity Surge
    if (availabilityRatio > 0 && availabilityRatio < 0.15) {
      finalPrice = Math.round(basePrice * 1.10);
    }
  } else if (product.type === 'mushroom') {
    const remainingPackets = inventory.totalMushroomPackets - inventory.soldMushroomPackets;
    const availabilityRatio = remainingPackets / inventory.totalMushroomPackets;

    // Scarcity Surge
    if (availabilityRatio > 0 && availabilityRatio < 0.15) {
      finalPrice = Math.round(basePrice * 1.15);
    } 
    // Evening Clearance (after 6 PM / 18:00)
    else if (currentHour >= 18 && availabilityRatio > 0.6) {
      finalPrice = Math.round(basePrice * 0.85);
    }
  }

  return finalPrice;
};
