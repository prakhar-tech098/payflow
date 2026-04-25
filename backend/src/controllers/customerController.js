const Customer = require("../models/Customer");

// Get all customers for logged in user
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user._id });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const customer = await Customer.create({
      userId: req.user._id,
      name,
      email,
      phone,
      address,
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Make sure user owns customer
    if (customer.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (customer.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await customer.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
