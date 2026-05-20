const db = require("../config/db");
const bcrypt = require("bcrypt");

// User Table Structure
const userTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE,
  role ENUM('user', 'admin') DEFAULT 'user'
)`;

// Create User Table
const createUserTable = async () => {
  try {
    await db.query(userTableQuery);
    console.log("Users table created or already exists");
  } catch (err) {
    console.error("Error creating users table:", err);
  }
};

// User Model Functions
const User = {
  // Create new user with password hashing
  create: async (userData) => {
    const query = "INSERT INTO users SET ?";
    return await db.query(query, [userData]);
  },

  // Get user by ID
  findById: async (id) => {
    const query = "SELECT * FROM users WHERE id = ?";
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Get user by email
  findByEmail: async (email) => {
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.query(query, [email]);
    return rows;
  },

  // Get user by username
  findByUsername: async (username) => {
    const query = "SELECT * FROM users WHERE username = ?";
    const [rows] = await db.query(query, [username]);
    return rows;
  },

  // Find user by email or username
  findByEmailOrUsername: async (identifier) => {
    const query = "SELECT * FROM users WHERE email = ? OR username = ?";
    const [rows] = await db.query(query, [identifier, identifier]);
    return rows;
  },

  // Get all users
  findAll: async () => {
    const query = "SELECT * FROM users";
    const [rows] = await db.query(query);
    return rows;
  },

  // Update user
  update: async (id, userData) => {
    const query = "UPDATE users SET ? WHERE id = ?";
    return await db.query(query, [userData, id]);
  },

  // Delete user
  delete: async (id) => {
    const query = "DELETE FROM users WHERE id = ?";
    return await db.query(query, [id]);
  },

  // Hash password with bcrypt
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  // Compare password with hashed password
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },
};

const ensureDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@gmail.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    const [existingUserRows] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [adminEmail, adminUsername],
    );

    if (existingUserRows.length > 0) {
      console.log('Default admin account already exists');
      return;
    }

    const hashedPassword = await User.hashPassword(adminPassword);
    await db.query(
      'INSERT INTO users (username, email, password, role, is_admin) VALUES (?, ?, ?, ?, ?)',
      [adminUsername, adminEmail, hashedPassword, 'admin', true],
    );

    console.log('Default admin account created:');
    console.log('  email:', adminEmail);
    console.log('  password:', adminPassword);
    console.log('  role: admin');
  } catch (error) {
    console.error('Error creating default admin account:', error);
  }
};

module.exports = { User, createUserTable, ensureDefaultAdmin };
