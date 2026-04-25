const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");

const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalCustomers, invoices] = await Promise.all([
      Customer.countDocuments({ userId }),
      Invoice.find({ userId }),
    ]);

    let totalRevenue = 0;
    let outstandingInvoices = 0;

    invoices.forEach((inv) => {
      if (inv.status === "Paid") {
        totalRevenue += inv.totalAmount;
      } else if (inv.status === "Sent" || inv.status === "Draft") {
        outstandingInvoices += 1;
      }
    });

    res.json({
      totalRevenue,
      outstandingInvoices,
      totalCustomers,
      activeActivity: invoices.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getDashboardMetrics };
