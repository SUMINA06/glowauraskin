const { User } = require("../model/User");
const { generateToken } = require("../config/jwt");

// Create a new user (default role: 'user') with password hashing
const createUser = async (req, res) => {
  try {
    const { username, email, password, phone, address } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Hash password before storing
    const hashedPassword = await User.hashPassword(password);

    const userData = {
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null,
      role: "user",
    };

    const result = await User.create(userData);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: result[0].insertId,
    });
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle duplicate entry errors
    if (error.code === "ER_DUP_ENTRY") {
      let message = "Email or username already exists";
      if (error.message.includes("username")) {
        message = "Username already exists";
      } else if (error.message.includes("email")) {
        message = "Email already exists";
      }
      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

// Create a new admin user (role: 'admin') with password hashing
const createAdminUser = async (req, res) => {
  try {
    const { username, email, password, phone, address } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Hash password before storing
    const hashedPassword = await User.hashPassword(password);

    const userData = {
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null,
      role: "admin",
      is_admin: true,
    };

    const result = await User.create(userData);

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      userId: result[0].insertId,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);

    // Handle duplicate entry errors
    if (error.code === "ER_DUP_ENTRY") {
      let message = "Email or username already exists";
      if (error.message.includes("username")) {
        message = "Username already exists";
      } else if (error.message.includes("email")) {
        message = "Email already exists";
      }
      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating admin user",
      error: error.message,
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(id);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// Get user by email
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findByEmail(email);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// Login user by email + password with JWT token
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const users = await User.findByEmail(email);

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // Compare password with hashed password
    const isPasswordValid = await User.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.username, user.role);

    // Do not return password to client
    const { password: _pw, ...safeUser } = user;

    // Ensure role is included
    if (!safeUser.role) {
      safeUser.role = safeUser.is_admin ? "admin" : "user";
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: safeUser,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error: error.message,
    });
  }
};

// Admin Login using database credentials with JWT token
const adminLogin = async (req, res) => {
  try {
    // Accept either `email` or `username` from the client as the identifier
    const { email, username, password } = req.body;
    const identifier = (email || username || "").toString();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier (username or email) and password are required",
      });
    }

    // Find admin user by email or username
    const users = await User.findByEmailOrUsername(identifier);

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const user = users[0];

    // Check if user has admin role
    if (user.role !== "admin" && !user.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    // Compare password with hashed password
    const isPasswordValid = await User.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.username, user.role);

    // Return a safe admin user object
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_admin: user.is_admin,
    };

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      data: safeUser,
    });
  } catch (error) {
    console.error("Error logging in admin:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};


// Verify admin token and return user info
const verifyAdminToken = async (req, res) => {
  try {
    // Token is already verified by authMiddleware
    // req.user contains the decoded token data
    const user = await User.findById(req.user.userId);

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has admin role
    if (user[0].role !== "admin" && !user[0].is_admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    // Return safe user info
    const { password: _pw, ...safeUser } = user[0];

    res.status(200).json({
      success: true,
      message: "Token verified",
      data: safeUser,
    });
  } catch (error) {
    console.error("Error verifying admin token:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying token",
      error: error.message,
    });
  }
};
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.update(id, updates);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.delete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  createAdminUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  loginUser,
  adminLogin,
  verifyAdminToken,
};
