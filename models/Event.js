const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
  },
  type: String,
});

module.exports = mongoose.model("Event", EventSchema);
