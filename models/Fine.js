const mongoose = require("mongoose");

const FineSchema = new mongoose.Schema({
  address: String,
  state: String,
  price: {
    type: Number,
    default: 0,
  },
  reason: {
    type: String,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Fine", FineSchema);
