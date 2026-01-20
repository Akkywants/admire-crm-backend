const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const Enquiry = require("../models/Enquiry");

/**
 * CREATE ENQUIRY
 * POST /api/enquiries
 * Allowed: Admin, Counsellor
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["Admin", "Counsellor"]),
  async (req, res) => {
    try {
      const {
        name,
        phone,
        email,
        courseInterested,
        enquiryDate,
        source,
        notes
      } = req.body;

      // Required fields (back-year allowed but still required)
      if (!name || !phone || !courseInterested || !enquiryDate) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      const enquiry = new Enquiry({
        name,
        phone,
        email,
        courseInterested,
        enquiryDate,
        source,
        notes,
        status: "Open",
        createdBy: req.user.id
      });

      await enquiry.save();

      res.status(201).json({
        message: "Enquiry created successfully",
        enquiry
      });
    } catch (error) {
      console.error("CREATE ENQUIRY ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * GET ALL ENQUIRIES (REPORT 1)
 * GET /api/enquiries
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role");

    res.json(enquiries);
  } catch (error) {
    console.error("GET ENQUIRIES ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET ENQUIRIES BY STATUS (REPORT 2)
 * GET /api/enquiries/status/Open
 * GET /api/enquiries/status/Converted
 */
router.get("/status/:status", authMiddleware, async (req, res) => {
  try {
    const status = req.params.status;

    const enquiries = await Enquiry.find({ status })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role");

    res.json(enquiries);
  } catch (error) {
    console.error("GET ENQUIRIES BY STATUS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
