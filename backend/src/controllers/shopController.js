const pool = require('../config/db');

// Get nearby shops (within radius using Haversine formula)
const getNearbyShops = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in km, default 5km

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    const [shops] = await pool.query(
      `SELECT store_id, name, description, address, gps_lat, gps_lng, phone, image_url, category, is_active,
        (6371 * acos(cos(radians(?)) * cos(radians(gps_lat)) * cos(radians(gps_lng) - radians(?)) + sin(radians(?)) * sin(radians(gps_lat)))) AS distance
      FROM stores 
      WHERE is_active = TRUE
      HAVING distance < ?
      ORDER BY distance`,
      [lat, lng, lat, radius]
    );

    res.json({ shops });
  } catch (error) {
    console.error('Get nearby shops error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get all shops
const getAllShops = async (req, res) => {
  try {
    if (!pool) throw new Error('DB pool not initialized');
    const [shops] = await pool.query(
      'SELECT store_id, name, description, address, gps_lat, gps_lng, phone, image_url, category, is_active FROM stores WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    res.json({ shops });
  } catch (error) {
    console.error('Get all shops error:', error);
    // If DB is not available, return empty array so frontend uses fallback
    res.json({ shops: [] });
  }
};

// Get shop by ID
const getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const [shops] = await pool.query(
      'SELECT s.*, u.full_name as owner_name FROM stores s JOIN users u ON s.owner_id = u.user_id WHERE s.store_id = ?',
      [id]
    );
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found.' });
    }
    res.json({ shop: shops[0] });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get products for a specific shop
const getShopProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    let query = 'SELECT * FROM products WHERE store_id = ? AND is_available = TRUE';
    const params = [id];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY name';
    const [products] = await pool.query(query, params);
    res.json({ products });
  } catch (error) {
    console.error('Get shop products error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Search products across all shops
const searchProducts = async (req, res) => {
  try {
    const { q, category } = req.query;

    let query = `
      SELECT p.*, s.name as store_name, s.address as store_address 
      FROM products p 
      JOIN stores s ON p.store_id = s.store_id 
      WHERE p.is_available = TRUE AND s.is_active = TRUE
    `;
    const params = [];

    if (q) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    query += ' ORDER BY p.name';
    const [products] = await pool.query(query, params);
    res.json({ products });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create store (vendor)
const createStore = async (req, res) => {
  try {
    const { name, description, address, gps_lat, gps_lng, phone, category } = req.body;

    if (!name || !address) {
      return res.status(400).json({ message: 'Store name and address are required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO stores (owner_id, name, description, address, gps_lat, gps_lng, phone, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.user_id, name, description || '', address, gps_lat || null, gps_lng || null, phone || null, category || 'General']
    );

    res.status(201).json({
      message: 'Store created successfully.',
      store_id: result.insertId,
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getNearbyShops, getAllShops, getShopById, getShopProducts, searchProducts, createStore };
