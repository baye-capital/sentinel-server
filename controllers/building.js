const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Building = require("../models/Building");
const Inspection = require("../models/Inspection");

// @desc    Get All Buildings
// @route   GET /api/v1/Building
// @access  Private / admin
exports.getBuildings = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Building
// @route   GET /api/v1/Building/:id
// @access  Private / admin
exports.getBuilding = asyncHandler(async (req, res, next) => {
  const building = await Building.findById(req.params.id).populate(
    req.query.populate
  );
  if (!building) {
    return next(
      new ErrorResponse(`Building not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: building,
  });
});

// @desc    Create Building
// @route   POST /api/v1/Building
// @access  Public
exports.createBuilding = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  const building = await Building.create(req.body);

  res.status(201).json({
    success: true,
    data: building,
  });
});

// @desc    Update Building details
// @route   PUT /api/v1/Building/:id
// @access  Private
exports.updateBuilding = asyncHandler(async (req, res, next) => {
  var building = await Building.findById(req.params.id).populate("inspection");

  if (!building) {
    return next(
      new ErrorResponse(`Building not found with id of ${req.params.id}`, 404)
    );
  }

  if (req.body.comment || req.body.requirement) {
    await Inspection.findByIdAndUpdate(
      building.inspection._id,
      {
        comment: req.body.comment,
        requirement: req.body.requirement,
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  building = await Building.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: building,
  });
});

// @desc    Delete Building
// @route   DELETE /api/v1/Building/:id
// @access  Private/Admin
exports.deleteBuilding = asyncHandler(async (req, res, next) => {
  const building = await Building.findById(req.params.id);
  if (!building) {
    return next(
      new ErrorResponse(`Building not found with id of ${req.params.id}`, 404)
    );
  }

  await Building.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
