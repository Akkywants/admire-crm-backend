const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const Enquiry = require("../models/Enquiry");
const Admission = require("../models/Admission");

/**
 * CONVERT ENQUIRY → ADMISSION
 * POST /api/admissions/convert/:enquiryId
 */
router.post("/convert/:enquiryId", authMiddleware, roleMiddleware(["Admin", "Coordinator"]), async (req, res) => {
  try {
    const { totalFees, installments } = req.body;

    if (!totalFees) {
      return res.status(400).json({ message: "totalFees is required" });
    }

    const enquiryId = req.params.enquiryId.trim();
    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    if (enquiry.status === "Converted") {
      return res.status(400).json({ message: "Enquiry already converted" });
    }

    const admission = new Admission({
      enquiry: enquiry._id,
      studentName: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      course: enquiry.courseInterested,
      totalFees,
      installments: installments || [],
      createdBy: req.user.id
    });

    await admission.save();

    enquiry.status = "Converted";
    if (!enquiry.createdBy) enquiry.createdBy = req.user.id; // legacy safety
    await enquiry.save();

    res.json({
      message: "Enquiry converted to admission",
      admission
    });
  } catch (error) {
    console.error("ADMISSION CONVERT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * REPORT 3 — LIST ALL ADMISSIONS
 * GET /api/admissions
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const admissions = await Admission.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role")
      .populate("enquiry", "name phone email");

    res.json(admissions);
  } catch (error) {
    console.error("GET ADMISSIONS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET SINGLE ADMISSION (OPTIONAL, VERY USEFUL)
 * GET /api/admissions/:id
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate("createdBy", "name role")
      .populate("enquiry", "name phone email");

    if (!admission) {
      return res.status(404).json({ message: "Admission not found" });
    }

    res.json(admission);
  } catch (error) {
    console.error("GET ADMISSION ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
