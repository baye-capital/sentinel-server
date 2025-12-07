const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
    },
    name: {
      type: String,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    role: {
      type: String,
      enum: [
        "state admin",
        "zonal head",
        "booking officer",
        "operator",
        "observer",
      ],
      default: "booking officer",
    },
    password: {
      type: String,
      minLength: 6,
      select: false,
    },
    picture: {
      type: String,
      default: "no-user.jpg",
    },
    state: {
      type: String,
    },
    zone: {
      type: String,
      enum: [
        "1",
        "1annex",
        "2",
        "2annex",
        "3",
        "3annex",
        "4",
        "4annex",
        "5",
        "6",
        "6annex",
        "7",
        "9",
        "10",
        "12",
        "13",
        "14",
        "15",
        "Unit 1",
        "Unit 2",
        "Unit 3",
        "Unit 4",
      ],
    },
    lastActive: { type: Date },
    phone: {
      type: String,
    },
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual("inspection", {
  ref: "Inspection",
  localField: "_id",
  foreignField: "createdBy",
});

UserSchema.virtual("insurance", {
  ref: "Insurance",
  localField: "_id",
  foreignField: "createdBy",
});

UserSchema.virtual("fire", {
  ref: "Fire",
  localField: "_id",
  foreignField: "createdBy",
});

UserSchema.virtual("fine", {
  ref: "Fine",
  localField: "_id",
  foreignField: "createdBy",
});

UserSchema.virtual("building", {
  ref: "Building",
  localField: "_id",
  foreignField: "createdBy",
});

// encrypt password using bcryptjs
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// custom error message
UserSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("This account already exists"));
  } else {
    next(error);
  }
});

// sign jwt and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      picture: this.picture,
      role: this.role,
      organisation: this.organisation,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// match user entered password to hashed password in DB
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash Token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// add full name
UserSchema.pre("save", function (next) {
  this.name = this.firstName + " " + this.lastName;
  next();
});

module.exports = mongoose.model("User", UserSchema);
