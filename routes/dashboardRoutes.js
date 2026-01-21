const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const Enquiry = require("../models/Enquiry");
const Admission = require("../models/Admission");
const Payment = require("../models/Payment");

router.get("/", auth, async (req, res) => {
  try {
    // ENQUIRIES
    const totalEnquiries = await Enquiry.countDocuments();
    const openEnquiries = await Enquiry.countDocuments({ status: "Open" });
    const convertedEnquiries = await Enquiry.countDocuments({ status: "Converted" });

    // ADMISSIONS & FINANCE
    const admissions = await Admission.find();

    let totalFees = 0;
    let collected = 0;

    admissions.forEach(a => {
      totalFees += a.totalFees || 0;
      collected += a.paidAmount || 0;
    });

    const pending = totalFees - collected;

    // TODAY COLLECTION
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPayments = await Payment.find({
      paymentDate: { $gte: today }
    });

    const todayCollection = todayPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // 📊 MONTHLY REVENUE (for chart)
    const monthlyRevenueRaw = await Payment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" }
          },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlyRevenue = monthlyRevenueRaw.map(m => ({
      month: `${m._id.month}-${m._id.year}`,
      amount: m.total
    }));

    res.json({
      enquiries: {
        total: totalEnquiries,
        open: openEnquiries,
        converted: convertedEnquiries
      },
      admissions: admissions.length,
      finance: {
        totalFees,
        collected,
        pending,
        today: todayCollection
      },
      charts: {
        monthlyRevenue,
        enquiryFunnel: [
          { name: "Open", value: openEnquiries },
          { name: "Converted", value: convertedEnquiries }
        ]
      }
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
