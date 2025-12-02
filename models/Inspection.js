const mongoose = require("mongoose");

const InspectionSchema = new mongoose.Schema({
  building: String,
  progress: {
    type: String,
    enum: ["Completed", "Uncompleted"],
    default: "Uncompleted",
  },
  comment: {
    type: String,
  },
  note: String,
  requirement: String,
  address: String,
  state: String,
  email: String,
  phoneNo: String,
  price: {
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["pending", "failed", "success"],
    default: "pending",
  },
  complete: {
    type: String,
    enum: ["complete", "pending", "missed"],
    default: "pending",
  },
  paid: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiry: {
    type: Date,
    default: () => Date.now() + 1000 * 60 * 60 * 24 * 30,
  },
});

module.exports = mongoose.model("Inspection", InspectionSchema);
