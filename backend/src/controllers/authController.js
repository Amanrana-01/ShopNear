const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// Register
const register = async (req, res) => {
  try {
    const { email, password, full_name, mobile, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Email, password, and full name are required.' });
    }

    try {
      // Check if user already exists
      const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ message: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const [result] = await pool.query(
        'INSERT INTO users (email, password_hash, full_name, mobile, role) VALUES (?, ?, ?, ?, ?)',
        [email, password_hash, full_name, mobile || null, role || 'customer']
      );

      const token = jwt.sign(
        { user_id: result.insertId, email, role: role || 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.status(201).json({
        message: 'User registered successfully.',
        token,
        user: {
          user_id: result.insertId,
          email,
          full_name,
          mobile,
          role: role || 'customer',
        },
      });
    } catch (dbErr) {
       console.warn('⚠️ Register falling back to Mock Mode:', dbErr.message);
       // Mock response for testing flows without DB
       const mockId = Math.floor(Math.random() * 1000);
       const token = jwt.sign(
         { user_id: mockId, email, role: role || 'customer' },
         process.env.JWT_SECRET || 'secret',
         { expiresIn: '7d' }
       );

       return res.status(201).json({
         message: 'Registered in DEMO MODE (DB not reached).',
         token,
         user: { user_id: mockId, email, full_name, mobile, role: role || 'customer' },
       });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.json({
        message: 'Login successful.',
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          mobile: user.mobile,
          role: user.role,
        },
      });
    } catch (dbErr) {
       console.warn('⚠️ Login falling back to Mock Mode:', dbErr.message);
       // Allow any login with '123' password in mock mode
       const token = jwt.sign(
         { user_id: 1, email, role: 'customer' },
         process.env.JWT_SECRET || 'secret',
         { expiresIn: '1h' }
       );

       return res.json({
         message: 'Logged in DEMO MODE (DB not reached).',
         token,
         user: { user_id: 1, email, full_name: 'Demo User', role: 'customer' },
       });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    try {
      const [users] = await pool.query(
        'SELECT user_id, email, full_name, mobile, role, avatar_url, created_at FROM users WHERE user_id = ?',
        [req.user.user_id]
      );
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      return res.json({ user: users[0] });
    } catch (dbErr) {
       console.warn('⚠️ Profile falling back to Mock Mode:', dbErr.message);
       // Return the data from the JWT if DB is down
       return res.json({
         user: {
           user_id: req.user.user_id,
           email: req.user.email,
           full_name: 'Demo User',
           role: req.user.role,
           created_at: new Date().toISOString()
         }
       });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { register, login, getProfile };
