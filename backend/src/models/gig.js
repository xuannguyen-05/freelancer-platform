const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema({
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
  img_url: {
    type: String,
    default: ""
  },
  img_public_id: {
    type: String,
    default: ""
  },

  category: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
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
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    avatar: {
      type: String,
      default: ""
    }
  },

  tags: [{
    type: String,
    trim: true
  }],

  price: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },

  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    index: true
  },

  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  }

}, { timestamps: true });

gigSchema.index({ rating: -1, reviewCount: -1, createdAt: -1 });
gigSchema.index({ price: 1, createdAt: -1 });
gigSchema.index({ createdAt: -1 });

const Gig = mongoose.model("Gig", gigSchema);

module.exports = Gig;