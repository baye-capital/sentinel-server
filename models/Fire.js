const mongoose = require("mongoose");

const FireSchema = new mongoose.Schema({
  address: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  state: String,
  type: {
    type: String,
    enum: ["Electrical", "Chemical", "Structural", "Other"],
  },
  cause: {
    type: String,
  },
  extent: {
    type: String,
  },
  injuries: Number,
  fatalities: Number,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Fire", FireSchema);
