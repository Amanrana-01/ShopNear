const express = require('express');
const router = express.Router();
const { getNearbyShops, getAllShops, getShopById, getShopProducts, searchProducts, createStore } = require('../controllers/shopController');
const { auth, vendorOnly } = require('../middleware/auth');

router.get('/nearby', getNearbyShops);
router.get('/all', getAllShops);
router.get('/search', searchProducts);
router.get('/:id', getShopById);
router.get('/:id/products', getShopProducts);
router.post('/', auth, vendorOnly, createStore);

module.exports = router;
