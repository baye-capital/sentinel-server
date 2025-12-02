const mongoose = require("mongoose");

const CollisionSchema = new mongoose.Schema({
  zone: String,
  team: String,
  location: String,
  desc: String,
  state: String,
  noOfCars: {
    type: "Number",
    default: 0,
    min: 0,
  },
  noOfInjuries: {
    type: "Number",
    min: 0,
    default: 0,
  },
  noOfFatalities: {
    type: "Number",
    default: 0,
    min: 0,
  },
  notes: String,
  vehicle: [
    new mongoose.Schema(
      {
        plate: {
          type: String,
          required: true,
        },
        make: String,
        model: String,
        name: String,
        phone: String,
        driverImg: String,
        vehicleImg: String,
      },
      { _id: false }
    ),
  ],
  witness: [
    new mongoose.Schema(
      {
        type: {
          type: String,
          required: true,
          enum: [
            "unknown",
            "witness",
            "driver",
            "passenger",
            "perpetrator",
            "bystander",
          ],
        },
        name: String,
        phone: String,
        statement: String,
      },
      { _id: false }
    ),
  ],
  img: String,
  vid: String,
  officer: [
    new mongoose.Schema(
      {
        perpetrator: {
          type: String,
          required: true,
          enum: ["unknown", "other"],
        },
        statement: String,
        type: String,
      },
      { _id: false }
    ),
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Collision", CollisionSchema);
