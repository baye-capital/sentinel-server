const mongoose = require("mongoose");

const OrganisationSchema = new mongoose.Schema({
  name: String,
  zones: [Number],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Organisation", OrganisationSchema);
