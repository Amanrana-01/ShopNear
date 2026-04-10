const express = require('express');
const router = express.Router();
const { getProducts, addProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus, getDashboard } = require('../controllers/vendorController');
const { auth, vendorOnly } = require('../middleware/auth');

// All vendor routes require authentication + vendor role
router.use(auth, vendorOnly);

router.get('/dashboard', getDashboard);
router.get('/products', getProducts);
router.post('/products', addProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
