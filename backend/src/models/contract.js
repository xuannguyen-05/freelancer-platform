const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["fixed", "hourly"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    hours: {
        type: Number,
        min: 0,
        default: null
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled"],
      default: "draft",
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

contractSchema.index({ projectId: 1, freelancerId: 1, status: 1 });

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
