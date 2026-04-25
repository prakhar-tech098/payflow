require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/customers", require("./src/routes/customerRoutes"));
app.use("/api/invoices", require("./src/routes/invoiceRoutes"));
app.use("/api/payment", require("./src/routes/paymentRoutes"));
app.use("/api/analytics", require("./src/routes/analyticsRoutes"));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("PayFlow API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

