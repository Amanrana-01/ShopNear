const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, toggleWishlist, getWishlist } = require('../controllers/orderController');
const { auth, customerOnly } = require('../middleware/auth');

router.use(auth, customerOnly);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.post('/wishlist', toggleWishlist);
router.get('/wishlist', getWishlist);

module.exports = router;
