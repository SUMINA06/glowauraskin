require('dotenv').config();
const mysql = require('mysql2');

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'nepmart',
  port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

pool.on('error', (err) => {
  console.error('MySQL pool error:', err);
});

console.log(`MySQL connection: host=${process.env.MYSQL_HOST || 'localhost'} user=${process.env.MYSQL_USER || 'root'} database=${process.env.MYSQL_DATABASE || 'nepmart'} port=${process.env.MYSQL_PORT || 3306}`);

// Export the promise-based version for cleaner code
module.exports = pool.promise();