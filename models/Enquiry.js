const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    courseInterested: {
      type: String,
      required: true
    },
    enquiryDate: {
      type: Date,
      required: true
    },
    status: {
  type: String,
  enum: ["Open", "FollowUp", "Converted"],
  default: "Open"
},
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
