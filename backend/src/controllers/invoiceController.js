const nodemailer = require("nodemailer");
const Invoice = require("../models/Invoice");

// Get all invoices for logged in user
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id }).populate("customerId", "name email");
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get public invoice
const getPublicInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customerId", "name email phone address")
      .populate("userId", "name email businessDetails");
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single invoice
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customerId");
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const { customerId, items, totalAmount, status, dueDate } = req.body;
    
    if (!customerId || !items || items.length === 0 || !totalAmount || !dueDate) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const invoice = await Invoice.create({
      userId: req.user._id,
      customerId,
      items,
      totalAmount,
      status: status || "Draft",
      dueDate,
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await invoice.deleteOne();
    res.json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customerId");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const customerEmail = invoice.customerId.email;
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const paymentLink = `${baseUrl}/pay/${invoice._id}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Invoice from PayFlow (ID: ${invoice._id.toString().substring(18)})`,
      text: `Hello ${invoice.customerId.name},\n\nPlease find your invoice details below.\nTotal Amount: Rs ${invoice.totalAmount}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nTo view and pay your invoice securely, click the link below:\n${paymentLink}\n\nThank you for your business!`,
    };

    await transporter.sendMail(mailOptions);

    invoice.status = "Sent";
    await invoice.save();

    res.json({ message: "Email sent successfully", invoice });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const sendPaymentReminder = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("customerId");

    if (!invoice || invoice.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const paymentLink = `${baseUrl}/pay/${invoice._id}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: invoice.customerId.email,
      subject: `Payment Reminder: Invoice ${invoice._id.toString().substring(18)}`,
      text: `Hello ${invoice.customerId.name},\n\nThis is a friendly reminder that your invoice for Rs ${invoice.totalAmount} is due on ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nTo view and pay your invoice securely, click the link below:\n${paymentLink}\n\nThank you!`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reminder sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  getPublicInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail,
  sendPaymentReminder,
};
