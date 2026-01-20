const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    mode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer"],
      required: true
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
