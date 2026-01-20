const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const Enquiry = require("../models/Enquiry");
const Admission = require("../models/Admission");
const Payment = require("../models/Payment");

/**
 * GET /api/dashboard
 */
router.get("/", auth, async (req, res) => {
  try {
    const totalEnquiries = await Enquiry.countDocuments();
    const openEnquiries = await Enquiry.countDocuments({ status: "Open" });
    const convertedEnquiries = await Enquiry.countDocuments({ status: "Converted" });

    const admissions = await Admission.find();
    const totalAdmissions = admissions.length;

    let totalFees = 0;
    let totalCollected = 0;

    admissions.forEach(a => {
      totalFees += a.totalFees || 0;
      totalCollected += a.paidAmount || 0;
    });

    const pendingBalance = totalFees - totalCollected;

    // Today's collection
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayPayments = await Payment.find({
      paymentDate: { $gte: todayStart }
    });

    const todaysCollection = todayPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

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
        pending: pendingBalance,
        today: todaysCollection
      }
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
