const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const Payment = require("../models/Payment");
const Admission = require("../models/Admission");

/**
 * ADD PAYMENT
 * POST /api/payments/:admissionId
 */
router.post("/:admissionId", auth, async (req, res) => {
  try {
    const { amount, mode } = req.body;

    if (!amount || !mode) {
      return res.status(400).json({ message: "amount and mode are required" });
    }

    const admission = await Admission.findById(req.params.admissionId);
    if (!admission) {
      return res.status(404).json({ message: "Admission not found" });
    }

    if (admission.balance <= 0) {
      return res.status(400).json({ message: "Fees already fully paid" });
    }

    const payment = new Payment({
      admission: admission._id,
      amount,
      mode,
      receivedBy: req.user.id
    });

    await payment.save();

    admission.paidAmount += amount;
    admission.balance = admission.totalFees - admission.paidAmount;
    await admission.save();

    res.status(201).json({
      message: "Payment recorded successfully",
      payment,
      balance: admission.balance
    });
  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET PAYMENT HISTORY
 * GET /api/payments/:admissionId
 */
router.get("/:admissionId", auth, async (req, res) => {
  try {
    const payments = await Payment.find({
      admission: req.params.admissionId
    })
      .populate("receivedBy", "name role")
      .sort({ paymentDate: -1 });

    res.json(payments);
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
