const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  buyer: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },

  freelancer: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },

  gig: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    }
  },

  package: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },
  serviceFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending"
  },

  deliveredAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

orderSchema.index({ "buyer._id": 1, createdAt: -1 });
orderSchema.index({ "freelancer._id": 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;