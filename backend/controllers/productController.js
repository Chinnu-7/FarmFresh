const Product = require('../models/Product');
const { calculateSmartPrice } = require('../utils/pricingEngine');
const DailyInventory = require('../models/DailyInventory');
const { startOfDay } = require('date-fns');

/**
 * @desc    Get all active products
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;

    const products = await Product.find(filter).sort('type name');
    
    // Apply Smart Pricing
    const today = startOfDay(new Date());
    const inventory = await DailyInventory.findOne({ date: today });
    
    const smartProducts = await Promise.all(products.map(async (p) => {
      const pObj = p.toObject();
      pObj.basePrice = p.price;
      pObj.price = await calculateSmartPrice(p, inventory);
      return pObj;
    }));

    res.json({ success: true, count: smartProducts.length, data: smartProducts });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const today = startOfDay(new Date());
    const inventory = await DailyInventory.findOne({ date: today });
    const pObj = product.toObject();
    pObj.basePrice = product.price;
    pObj.price = await calculateSmartPrice(product, inventory);

    res.json({ success: true, data: pObj });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a product (Admin)
 * @route   POST /api/products
 * @access  Private/Admin
 */
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product (Admin)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
