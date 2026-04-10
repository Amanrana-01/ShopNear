const pool = require('../config/db');

// Get vendor's products
const getProducts = async (req, res) => {
  try {
    // Get vendor's store first
    const [stores] = await pool.query('SELECT store_id FROM stores WHERE owner_id = ?', [req.user.user_id]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'No store found for this vendor.' });
    }

    const storeId = stores[0].store_id;
    const [products] = await pool.query(
      'SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC',
      [storeId]
    );
    res.json({ products });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Add product
const addProduct = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Product name and price are required.' });
    }

    const [stores] = await pool.query('SELECT store_id FROM stores WHERE owner_id = ?', [req.user.user_id]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'No store found for this vendor.' });
    }

    const storeId = stores[0].store_id;
    const [result] = await pool.query(
      'INSERT INTO products (store_id, name, description, price, stock_quantity, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [storeId, name, description || '', price, stock_quantity || 0, category || 'General', image_url || null]
    );

    res.status(201).json({
      message: 'Product added successfully.',
      product_id: result.insertId,
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category, image_url, is_available } = req.body;

    // Verify ownership
    const [stores] = await pool.query('SELECT store_id FROM stores WHERE owner_id = ?', [req.user.user_id]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'No store found for this vendor.' });
    }

    const [product] = await pool.query('SELECT * FROM products WHERE product_id = ? AND store_id = ?', [id, stores[0].store_id]);
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found or not owned by you.' });
    }

    await pool.query(
      `UPDATE products SET 
        name = COALESCE(?, name), 
        description = COALESCE(?, description), 
        price = COALESCE(?, price), 
        stock_quantity = COALESCE(?, stock_quantity), 
        category = COALESCE(?, category),
        image_url = COALESCE(?, image_url),
        is_available = COALESCE(?, is_available)
      WHERE product_id = ?`,
      [name, description, price, stock_quantity, category, image_url, is_available, id]
    );

    res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [stores] = await pool.query('SELECT store_id FROM stores WHERE owner_id = ?', [req.user.user_id]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'No store found for this vendor.' });
    }

    const [result] = await pool.query('DELETE FROM products WHERE product_id = ? AND store_id = ?', [id, stores[0].store_id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or not owned by you.' });
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get vendor orders
const getOrders = async (req, res) => {
  try {
    const [stores] = await pool.query('SELECT store_id FROM stores WHERE owner_id = ?', [req.user.user_id]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'No store found for this vendor.' });
    }

    const storeId = stores[0].store_id;
    const [orders] = await pool.query(
      `SELECT o.*, u.full_name as customer_name, u.mobile as customer_mobile 
       FROM orders o 
       JOIN users u ON o.user_id = u.user_id 
       WHERE o.store_id = ? 
       ORDER BY o.order_date DESC`,
      [storeId]
    );

    // Get details for each order
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
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const [stores] = await pool.query('SELECT store_id FROM stores WHERE owner_id = ?', [req.user.user_id]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'No store found.' });
    }

    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE order_id = ? AND store_id = ?',
      [status, id, stores[0].store_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order status updated.' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get vendor dashboard stats
const getDashboard = async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ message: 'DB not available' });
    const [stores] = await pool.query('SELECT store_id, name FROM stores WHERE owner_id = ?', [req.user.user_id]);
    if (stores.length === 0) {
      return res.status(404).json({ message: 'No store found for this vendor.' });
    }

    const storeId = stores[0].store_id;

    // Get order counts
    const [newOrders] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE store_id = ? AND status = "pending"',
      [storeId]
    );
    const [inProgress] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE store_id = ? AND status = "in_progress"',
      [storeId]
    );
    const [totalProducts] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE store_id = ?',
      [storeId]
    );

    // Get weekly fulfillment data (last 7 days grouped by day)
    const [fulfillment] = await pool.query(
      `SELECT 
        DAYNAME(order_date) as day,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status != 'completed' THEN 1 END) as other
      FROM orders 
      WHERE store_id = ? AND order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DAYNAME(order_date), DAYOFWEEK(order_date)
      ORDER BY DAYOFWEEK(order_date)`,
      [storeId]
    );

    res.json({
      store_name: stores[0].name,
      new_orders: newOrders[0].count,
      in_progress: inProgress[0].count,
      total_products: totalProducts[0].count,
      fulfillment,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getProducts, addProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus, getDashboard };
