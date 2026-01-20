const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    paid: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const admissionSchema = new mongoose.Schema(
  {
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
      unique: true // prevent duplicate conversion
    },

    studentName: {
      type: String,
      required: true
    },

    email: String,
    phone: String,

    course: {
      type: String,
      required: true
    },

    totalFees: {
      type: Number,
      required: true
    },

    paidAmount: {
      type: Number,
      default: 0
    },

    balance: {
      type: Number,
      required: true
    },

    installments: [installmentSchema],

    admissionDate: {
      type: Date,
      default: Date.now
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

/**
 * Auto-set balance on creation
 */
admissionSchema.pre("validate", function () {
  if (this.isNew && this.balance === undefined) {
    this.balance = this.totalFees;
  }
});


module.exports = mongoose.model("Admission", admissionSchema);
