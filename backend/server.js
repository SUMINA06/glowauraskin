require("dotenv").config();
const express = require("express");
const path = require("path");

const db = require("./config/db");
const { createUserTable, ensureDefaultAdmin } = require("./model/User");
const { createProductTable } = require("./model/Product");
const { createImageTable } = require("./model/Image");
const { createOrderTable, createOrderItemsTable } = require("./model/Order");
const { createCartTable } = require("./model/Cart");
const { migrateDatabase, addRoleColumn } = require("./migrate");

// Import routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const imageRoutes = require("./routes/imageRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Verify the connection to the database
const verifyDatabaseConnection = async () => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");
    console.log("Database connection verified:", rows[0]);
  } catch (error) {
    console.error("Unable to verify database connection:", error);
    throw error;
  }
};

// Initialize database tables
const initializeTables = async () => {
  try {
    await verifyDatabaseConnection();

    // Create base tables in order to satisfy foreign keys
    await createUserTable();
    await createProductTable();
    await createOrderTable();
    await createOrderItemsTable();
    await createCartTable();
    await createImageTable();

    // Add role column for role-based auth if needed
    await addRoleColumn();

    // Run migration to fix schema if needed
    await migrateDatabase();

    // Ensure a default admin user exists
    await ensureDefaultAdmin();
  } catch (error) {
    console.error("Error during table initialization:", error);
    throw error;
  }
};

const port = process.env.PORT || 3000;

// Initialize tables and start server
initializeTables()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database tables:", err);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("Hello from server side");
});
