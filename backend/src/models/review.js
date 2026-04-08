const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },

  reviewer: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },

  reviewee: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: "",
    trim: true
  }

}, { timestamps: true });


reviewSchema.index(
  { orderId: 1, "reviewer._id": 1 },
  { unique: true }
);

reviewSchema.index({ "reviewee._id": 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;