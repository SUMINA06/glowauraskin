const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { authMiddleware, adminMiddleware } = require("../config/jwt");

// Login
router.post("/login", userController.loginUser);

// Admin Login
router.post("/admin/login", userController.adminLogin);

// Verify admin token
router.get("/admin/verify", authMiddleware, adminMiddleware, userController.verifyAdminToken);

// Admin Register (creates user with role='admin')
router.post("/admin/register", userController.createAdminUser);

// Create a new user (regular user registration)
router.post("/", userController.createUser);

// Get all users
router.get("/", userController.getAllUsers);

// Get user by email (specific route before generic :id)
router.get("/email/:email", userController.getUserByEmail);

// Get user by ID (generic route after specific ones)
router.get("/:id", userController.getUserById);

// Update user
router.put("/:id", userController.updateUser);

// Delete user
router.delete("/:id", userController.deleteUser);

module.exports = router;
