const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  gigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gig",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: "",
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryDay: {
    type: Number,
    required: true,
    min: 1
  },
  revision: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Package = mongoose.model("Package", packageSchema);

module.exports = Package;