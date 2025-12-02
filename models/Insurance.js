const mongoose = require("mongoose");
const uuid = require("uuid");

const InsuranceSchema = new mongoose.Schema({
  policy: {
    type: String,
    required: [true, "Please add a name"],
    enum: ["Occupiers Liability Insurance", "Public Liability Insurance"],
    default: "Occupiers Liability Insurance",
  },
  building: {
    type: new mongoose.Schema(
      {
        name: String,
        rate: [
          new mongoose.Schema(
            {
              name: String,
              rate: Number,
              no: Number,
            },
            { _id: false }
          ),
        ],
        special: String,
      },
      { _id: false }
    ),
  },
  estate: {
    type: String,
    enum: ["Corporate", "Residential"],
    default: "Corporate",
  },
  buildingNo: {
    type: String,
  },
  area: {
    type: String,
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  address: String,
  state: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["pending", "failed", "success"],
    default: "pending",
  },
  reference: {
    type: String,
    unique: true,
  },
  organisation: {
    type: String,
  },
  claim: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiry: {
    type: Date,
    default: () => Date.now() + 1000 * 60 * 60 * 24 * 365,
  },
});

InsuranceSchema.pre("save", function (next) {
  if (!this.reference) {
    this.reference = uuid.v4();
  }
  next();
});

module.exports = mongoose.model("Insurance", InsuranceSchema);
