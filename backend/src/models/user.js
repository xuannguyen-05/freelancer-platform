const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  avatar: {
    type: String,
    default: ""
  },

  bio: {
    type: String,
    default: "",
    trim: true
  },

  role: {
    type: String,
    enum: ["buyer", "freelancer", "admin"],
    default: "buyer",
    index: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  freelancerProfile: {
    slogan: {
      type: String,
      default: "",
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    level: {
      type: Number,
      default: 1
    },
    rating: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },

  skills: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill"
    }
  ]

}, { timestamps: true });


const User = mongoose.model("User", userSchema);

module.exports = User;