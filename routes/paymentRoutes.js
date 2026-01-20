const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const Admission = require("../models/Admission");
const Payment = require("../models/Payment");

/**
 * ADD PAYMENT
 * POST /api/payments/:admissionId
 */
router.post("/:admissionId", authMiddleware, roleMiddleware(["Admin", "Coordinator"]), async (req, res) => {
  try {
    const { amount, mode } = req.body;

    if (!amount || !mode) {
      return res.status(400).json({ message: "amount and mode are required" });
    }

    const admissionId = req.params.admissionId.trim();
    const admission = await Admission.findById(admissionId);

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
    console.error("ADD PAYMENT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * REPORT 4 — LIST ALL PAYMENTS
 * GET /api/payments
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate("admission", "studentName course totalFees")
      .populate("receivedBy", "name role");

    res.json(payments);
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
