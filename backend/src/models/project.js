const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
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
  status: {
    type: String,
    enum: ["planning", "in_progress", "delivered", "completed", "cancelled"],
    default: "planning",
    index: true
  }
}, { timestamps: true });

projectSchema.index({ orderId: 1 }, { unique: true }) 

projectSchema.index({ buyerId: 1, createdAt: -1 })

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
