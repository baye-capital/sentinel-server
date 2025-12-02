const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Fire = require("../models/Fire");
const { getDateBounds } = require("../utils/dateHandler");
const Building = require("../models/Building");

// @desc    Get All Fires
// @route   GET /api/v1/Fire
// @access  Private / admin
exports.getFires = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Fire
// @route   GET /api/v1/Fire/:id
// @access  Private / admin
exports.getFire = asyncHandler(async (req, res, next) => {
  const fire = await Fire.findById(req.params.id).populate(req.query.populate);
  if (!fire) {
    return next(
      new ErrorResponse(`Fire not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: fire,
  });
});

// @desc    Create Fire
// @route   POST /api/v1/Fire
// @access  Public
exports.createFire = asyncHandler(async (req, res, next) => {
  const building = await Building.findOne({ address: req.body.address });

  req.body.createdBy = req.user._id;

  const fire = await Fire.create(req.body);

  if (!building) {
    await Building.create({
      address: req.body.address,
      fire: fire._id,
      createdBy: req.user._id,
    });
  } else {
    await Building.findByIdAndUpdate(
      building._id,
      {
        fire: fire._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  res.status(201).json({
    success: true,
    data: fire,
  });
});

// @desc    Update Fire details
// @route   PUT /api/v1/Fire/:id
// @access  Private
exports.updateFire = asyncHandler(async (req, res, next) => {
  var fire = await Fire.findById(req.params.id);

  fire = await Fire.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: fire,
  });
});

// @desc    Delete Fire
// @route   DELETE /api/v1/Fire/:id
// @access  Private/Admin
exports.deleteFire = asyncHandler(async (req, res, next) => {
  const fire = await Fire.findById(req.params.id);
  if (!fire) {
    return next(
      new ErrorResponse(`Fire not found with id of ${req.params.id}`, 404)
    );
  }

  await Fire.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get fire number for the month
// @route   GET /api/v1/fire/stats
// @access  Private/Admin
exports.getFiresMonth = asyncHandler(async (req, res, next) => {
  const dateBounds = getDateBounds();

  const currFire = await Fire.find({
    createdAt: {
      // $gte: dateBounds.startOfMonth.toDate(),
      $lte: dateBounds.endOfMonth.toDate(),
    },
    ...req.query,
  }).select("name");

  const currentFire = currFire ? currFire.length : 0;

  const lastFire = await Fire.find({
    createdAt: {
      // $gte: dateBounds.startOfLastMonth.toDate(),
      $lte: dateBounds.endOfLastMonth.toDate(),
    },
    status: "success",
  }).select("name");

  const lastFires = lastFire ? lastFire.length : 0;

  const fireRise =
    lastFires === 0
      ? 0
      : Math.floor(((currentFire - lastFires) / lastFires) * 100);

  res.status(200).json({
    success: true,
    data: {
      fireRise,
      currentFire,
      month: dateBounds.month,
    },
  });
});

// @desc    Get all Fire stats
// @route   GET /api/v1/Fire/:id
// @access  Private / admin
exports.getFireStats = asyncHandler(async (req, res, next) => {
  const fire = await Building.find({ status: { $gt: 1 }, ...req.query });
  var total = 0;
  if (fire) {
    total = fire.length;
  }

  res.status(200).json({
    success: true,
    data: { total },
  });
});
