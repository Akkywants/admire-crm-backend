const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Payment = require("../models/Payment");
const Enquiry = require("../models/Enquiry");
const Admission = require("../models/Admission");

/**
 * DASHBOARD SUMMARY
 * GET /api/dashboard
 */
router.get("/", auth, async (req, res) => {
  try {
    const totalEnquiries = await Enquiry.countDocuments();
    const openEnquiries = await Enquiry.countDocuments({ status: "Open" });
    const convertedEnquiries = await Enquiry.countDocuments({ status: "Converted" });

    const totalAdmissions = await Admission.countDocuments();

    const payments = await Payment.find();

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    const totalFeesAgg = await Admission.aggregate([
      { $group: { _id: null, total: { $sum: "$totalFees" } } }
    ]);

    const totalFees = totalFeesAgg[0]?.total || 0;
    const pending = totalFees - totalCollected;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayPayments = await Payment.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      enquiries: {
        total: totalEnquiries,
        open: openEnquiries,
        converted: convertedEnquiries
      },
      admissions: totalAdmissions,
      finance: {
        totalFees,
        collected: totalCollected,
        pending,
        today: todayPayments[0]?.total || 0
      }
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * MONTHLY COLLECTION TREND
 * GET /api/dashboard/monthly
 */
router.get("/monthly", auth, async (req, res) => {
  try {
    const data = await Payment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const formatted = data.map(d => ({
      month: `${d._id.month}-${d._id.year}`,
      amount: d.total
    }));

    res.json(formatted);
  } catch (err) {
    console.error("MONTHLY DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
