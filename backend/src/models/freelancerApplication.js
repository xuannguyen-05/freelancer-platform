const mongoose = require("mongoose");

const freelancerApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    slogan: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill"
      }
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

freelancerApplicationSchema.index({ userId: 1, status: 1 });
freelancerApplicationSchema.index({ createdAt: -1 });

const FreelancerApplication = mongoose.model(
  "FreelancerApplication",
  freelancerApplicationSchema
);

module.exports = FreelancerApplication;
