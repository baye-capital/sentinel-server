const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Organisation = require("../models/Organisation");
const { getDateBounds } = require("../utils/dateHandler");
const Building = require("../models/Building");

// @desc    Get All Organisations
// @route   GET /api/v1/Organisation
// @access  Private / admin
exports.getOrganisations = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Organisation
// @route   GET /api/v1/Organisation/:id
// @access  Private / admin
exports.getOrganisation = asyncHandler(async (req, res, next) => {
  const organisation = await Organisation.findById(req.params.id).populate(
    req.query.populate
  );
  if (!organisation) {
    return next(
      new ErrorResponse(
        `Organisation not found with id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: organisation,
  });
});

// @desc    Create Organisation
// @route   POST /api/v1/Organisation
// @access  Public
exports.createOrganisation = asyncHandler(async (req, res, next) => {
  const building = await Building.findOne({ address: req.body.address });

  req.body.createdBy = req.user._id;

  const organisation = await Organisation.create(req.body);

  if (!building) {
    await Building.create({
      address: req.body.address,
      organisation: organisation._id,
      createdBy: req.user._id,
    });
  } else {
    await Building.findByIdAndUpdate(
      building._id,
      {
        organisation: organisation._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  res.status(201).json({
    success: true,
    data: organisation,
  });
});

// @desc    Update Organisation details
// @route   PUT /api/v1/Organisation/:id
// @access  Private
exports.updateOrganisation = asyncHandler(async (req, res, next) => {
  var organisation = await Organisation.findById(req.params.id);

  organisation = await Organisation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: organisation,
  });
});

// @desc    Delete Organisation
// @route   DELETE /api/v1/Organisation/:id
// @access  Private/Admin
exports.deleteOrganisation = asyncHandler(async (req, res, next) => {
  const organisation = await Organisation.findById(req.params.id);
  if (!organisation) {
    return next(
      new ErrorResponse(
        `Organisation not found with id of ${req.params.id}`,
        404
      )
    );
  }

  await Organisation.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get organisation number for the month
// @route   GET /api/v1/organisation/stats
// @access  Private/Admin
exports.getOrganisationsMonth = asyncHandler(async (req, res, next) => {
  const dateBounds = getDateBounds();

  const currOrganisation = await Organisation.find({
    createdAt: {
      // $gte: dateBounds.startOfMonth.toDate(),
      $lte: dateBounds.endOfMonth.toDate(),
    },
  }).select("name");

  const currentOrganisation = currOrganisation ? currOrganisation.length : 0;

  const lastOrganisation = await Organisation.find({
    createdAt: {
      // $gte: dateBounds.startOfLastMonth.toDate(),
      $lte: dateBounds.endOfLastMonth.toDate(),
    },
    status: "success",
  }).select("name");

  const lastOrganisations = lastOrganisation ? lastOrganisation.length : 0;

  const organisationRise =
    lastOrganisations === 0
      ? 0
      : Math.floor(
          ((currentOrganisation - lastOrganisations) / lastOrganisations) * 100
        );

  res.status(200).json({
    success: true,
    data: {
      organisationRise,
      currentOrganisation,
      month: dateBounds.month,
    },
  });
});

// @desc    Get all Organisation stats
// @route   GET /api/v1/Organisation/:id
// @access  Private / admin
exports.getOrganisationStats = asyncHandler(async (req, res, next) => {
  const organisation = await Building.find({ status: { $gt: 1 } });
  var total = 0;
  if (organisation) {
    total = organisation.length;
  }

  res.status(200).json({
    success: true,
    data: { total },
  });
});
