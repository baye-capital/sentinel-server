const mongoose = require("mongoose");

const BuildingSchema = new mongoose.Schema({
  address: String,
  status: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  fire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fire",
  },
  insurance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Insurance",
  },
  inspection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inspection",
  },
  fines: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fines",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  expiry: {
    type: Date,
    default: () => Date.now() + 1000 * 60 * 60 * 24 * 365,
  },
});

module.exports = mongoose.model("Building", BuildingSchema);
