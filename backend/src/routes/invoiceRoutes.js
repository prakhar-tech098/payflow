const express = require("express");
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  getPublicInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail,
  sendPaymentReminder
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

router.route("/public/:id").get(getPublicInvoiceById);

router.route("/").get(protect, getInvoices).post(protect, createInvoice);
router.route("/:id").get(protect, getInvoiceById).put(protect, updateInvoice).delete(protect, deleteInvoice);
router.route("/:id/send").post(protect, sendInvoiceEmail);
router.route("/:id/remind").post(protect, sendPaymentReminder);

module.exports = router;
