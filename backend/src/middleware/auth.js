const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const vendorOnly = (req, res, next) => {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ message: 'Access denied. Vendor only.' });
  }
  next();
};

const customerOnly = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customer only.' });
  }
  next();
};

module.exports = { auth, vendorOnly, customerOnly };
