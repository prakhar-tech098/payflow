const mongoose = require("mongoose");

const invoiceItemSchema = mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const invoiceSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Customer" },
    items: [invoiceItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["Draft", "Sent", "Paid"], default: "Draft" },
    dueDate: { type: Date, required: true },
    pdfUrl: { type: String }
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
