const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Invoice" },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["Created", "Successful", "Failed"], default: "Created" }
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
