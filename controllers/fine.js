const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Fine = require("../models/Fine");
const { getDateBounds } = require("../utils/dateHandler");
const Building = require("../models/Building");

// @desc    Get All Fines
// @route   GET /api/v1/Fine
// @access  Private / admin
exports.getFines = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Fine
// @route   GET /api/v1/Fine/:id
// @access  Private / admin
exports.getFine = asyncHandler(async (req, res, next) => {
  const fine = await Fine.findById(req.params.id).populate(req.query.populate);
  if (!fine) {
    return next(
      new ErrorResponse(`Fine not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: fine,
  });
});

// @desc    Create Fine
// @route   POST /api/v1/Fine
// @access  Public
exports.createFine = asyncHandler(async (req, res, next) => {
  const building = await Building.findOne({ address: req.body.address });

  if (!building) {
    return next(
      new ErrorResponse(`Building not found: ${req.body.address}`, 404)
    );
  }

  req.body.createdBy = req.user._id;

  const fine = await Fine.create(req.body);

  await Building.findByIdAndUpdate(
    building._id,
    {
      fines: fine._id,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(201).json({
    success: true,
    data: fine,
  });
});

// @desc    Update Fine details
// @route   PUT /api/v1/Fine/:id
// @access  Private
exports.updateFine = asyncHandler(async (req, res, next) => {
  var fine = await Fine.findById(req.params.id);

  fine = await Fine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: fine,
  });
});

// @desc    Delete Fine
// @route   DELETE /api/v1/Fine/:id
// @access  Private/Admin
exports.deleteFine = asyncHandler(async (req, res, next) => {
  const fine = await Fine.findById(req.params.id);
  if (!fine) {
    return next(
      new ErrorResponse(`Fine not found with id of ${req.params.id}`, 404)
    );
  }

  await Fine.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get fine number for the month
// @route   GET /api/v1/fine/stats
// @access  Private/Admin
exports.getFinesMonth = asyncHandler(async (req, res, next) => {
  const dateBounds = getDateBounds();

  const currFine = await Fine.find({
    createdAt: {
      // $gte: dateBounds.startOfMonth.toDate(),
      $lte: dateBounds.endOfMonth.toDate(),
    },
    ...req.query,
  }).select("name");

  const currentFine = currFine ? currFine.length : 0;

  const lastFine = await Fine.find({
    createdAt: {
      // $gte: dateBounds.startOfLastMonth.toDate(),
      $lte: dateBounds.endOfLastMonth.toDate(),
    },
    status: "success",
  }).select("name");

  const lastFines = lastFine ? lastFine.length : 0;

  const fineRise =
    lastFines === 0
      ? 0
      : Math.floor(((currentFine - lastFines) / lastFines) * 100);

  res.status(200).json({
    success: true,
    data: {
      fineRise,
      currentFine,
      month: dateBounds.month,
    },
  });
});

// @desc    Get all Fine stats
// @route   GET /api/v1/Fine/:id
// @access  Private / admin
exports.getFineStats = asyncHandler(async (req, res, next) => {
  const fine = await Fine.find(req.query);
  var total = 0;
  var revenue = 0;
  if (fine) {
    total = fine.length;
    fine.forEach((element) => {
      revenue += element.price;
    });
  }

  res.status(200).json({
    success: true,
    data: { total, revenue },
  });
});
