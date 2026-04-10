const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopnear',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Test connection on startup
  pool.getConnection()
    .then(conn => {
      console.log('✅ MySQL connected successfully');
      conn.release();
    })
    .catch(err => {
      console.warn('⚠️  MySQL not available:', err.message);
      console.warn('   The API will start but database operations will fail.');
      console.warn('   Please configure MySQL and run: mysql -u root < database/schema.sql');
    });
} catch (err) {
  console.warn('⚠️  MySQL pool creation failed:', err.message);
}

module.exports = pool;
