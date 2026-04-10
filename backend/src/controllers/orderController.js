const pool = require('../config/db');

// Create order
const createOrder = async (req, res) => {
  try {
    const { store_id, items, notes } = req.body;

    if (!store_id || !items || items.length === 0) {
      return res.status(400).json({ message: 'Store ID and items are required.' });
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const [products] = await pool.query('SELECT price FROM products WHERE product_id = ?', [item.product_id]);
      if (products.length === 0) {
        return res.status(404).json({ message: `Product ${item.product_id} not found.` });
      }
      totalAmount += products[0].price * item.quantity;
    }

    // Create order
    const [orderResult] = await pool.query(
      'INSERT INTO orders (user_id, store_id, total_amount, notes) VALUES (?, ?, ?, ?)',
      [req.user.user_id, store_id, totalAmount, notes || null]
    );

    // Insert order details
    for (const item of items) {
      const [products] = await pool.query('SELECT price FROM products WHERE product_id = ?', [item.product_id]);
      await pool.query(
        'INSERT INTO order_details (order_id, product_id, quantity, unit_price_at_sale) VALUES (?, ?, ?, ?)',
        [orderResult.insertId, item.product_id, item.quantity, products[0].price]
      );

      // Update stock
      await pool.query(
        'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    res.status(201).json({
      message: 'Order created successfully.',
      order_id: orderResult.insertId,
      total_amount: totalAmount,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get customer orders
const getMyOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, s.name as store_name 
       FROM orders o 
       JOIN stores s ON o.store_id = s.store_id 
       WHERE o.user_id = ? 
       ORDER BY o.order_date DESC`,
      [req.user.user_id]
    );

    for (let order of orders) {
      const [details] = await pool.query(
        `SELECT od.*, p.name as product_name 
         FROM order_details od 
         JOIN products p ON od.product_id = p.product_id 
         WHERE od.order_id = ?`,
        [order.order_id]
      );
      order.items = details;
    }

    res.json({ orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Toggle wishlist
const toggleWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?',
      [req.user.user_id, product_id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.user_id, product_id]);
      res.json({ message: 'Removed from wishlist.', wishlisted: false });
    } else {
      await pool.query('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.user_id, product_id]);
      res.json({ message: 'Added to wishlist.', wishlisted: true });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get wishlist
const getWishlist = async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT w.*, p.name, p.price, p.image_url, p.category, s.name as store_name 
       FROM wishlists w 
       JOIN products p ON w.product_id = p.product_id 
       JOIN stores s ON p.store_id = s.store_id 
       WHERE w.user_id = ?`,
      [req.user.user_id]
    );
    res.json({ wishlist: items });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { createOrder, getMyOrders, toggleWishlist, getWishlist };
