-- ShopNear Database Schema
-- MySQL

CREATE DATABASE IF NOT EXISTS shopnear;
USE shopnear;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  role ENUM('customer', 'vendor') NOT NULL DEFAULT 'customer',
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  store_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500) NOT NULL,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  phone VARCHAR(20),
  image_url VARCHAR(500),
  category VARCHAR(100) DEFAULT 'General',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  category VARCHAR(100),
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  store_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

-- Order Details table
CREATE TABLE IF NOT EXISTS order_details (
  detail_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price_at_sale DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Inventory Snapshots table
CREATE TABLE IF NOT EXISTS inventory_snapshots (
  snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  product_id INT NOT NULL,
  stock_quantity INT NOT NULL,
  snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist (user_id, product_id)
);

-- Seed data for demo purposes
INSERT INTO users (email, password_hash, full_name, mobile, role) VALUES
('customer@demo.com', '$2a$10$dummy_hash_for_demo_customer', 'Rahul Sharma', '9876543210', 'customer'),
('vendor@demo.com', '$2a$10$dummy_hash_for_demo_vendor', 'Priya Patel', '9876543211', 'vendor');

INSERT INTO stores (owner_id, name, description, address, gps_lat, gps_lng, phone, category) VALUES
(2, 'The Local Market', 'Fresh groceries and daily essentials', '123 MG Road, Bangalore', 12.9716, 77.5946, '9876543211', 'Grocery'),
(2, 'Baker''s Corner', 'Freshly baked goods every morning', '45 Church Street, Bangalore', 12.9750, 77.6010, '9876543212', 'Bakery');

INSERT INTO products (store_id, name, description, price, stock_quantity, category) VALUES
(1, 'Fresh Tomatoes', 'Farm fresh red tomatoes - 1kg', 40.00, 50, 'Fruits'),
(1, 'Organic Milk', 'Farm fresh organic milk - 1L', 65.00, 30, 'Dairy'),
(1, 'Basmati Rice', 'Premium aged basmati rice - 5kg', 450.00, 20, 'Grocery'),
(1, 'Mixed Fruits Basket', 'Assorted seasonal fruits', 299.00, 15, 'Fruits'),
(1, 'Paneer', 'Fresh cottage cheese - 200g', 80.00, 25, 'Dairy'),
(2, 'Sourdough Bread', 'Artisan sourdough loaf', 120.00, 10, 'Baked Goods'),
(2, 'Chocolate Croissant', 'Buttery croissant with chocolate', 85.00, 20, 'Baked Goods'),
(2, 'Whole Wheat Bread', 'Healthy whole wheat bread loaf', 55.00, 15, 'Baked Goods'),
(2, 'Blueberry Muffin', 'Fresh blueberry muffins - 2 pack', 95.00, 12, 'Baked Goods');
