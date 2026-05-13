const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct } = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.route('/:id')
  .get(getProduct)
  .put(protect, admin, updateProduct);

module.exports = router;
