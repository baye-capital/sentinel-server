const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Inspection = require("../models/Inspection");
const { uploadToS3 } = require("../utils/fileUploadService");
const { getDateBounds, filterObj } = require("../utils/dateHandler");
const { sendSms } = require("../utils/message");

// @desc    Get All Inspections
// @route   GET /api/v1/Inspection
// @access  Private / admin
exports.getInspections = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Inspection
// @route   GET /api/v1/Inspection/:id
// @access  Private / admin
exports.getInspection = asyncHandler(async (req, res, next) => {
  // Apply zone filter from middleware
  let query = { _id: req.params.id };
  if (req.zoneFilter && Object.keys(req.zoneFilter).length > 0) {
    query = { ...query, ...req.zoneFilter };
  }

  const inspection = await Inspection.findOne(query).populate(
    req.query.populate
  );
  if (!inspection) {
    return next(
      new ErrorResponse(`Inspection not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: inspection,
  });
});

// @desc    Create Inspection
// @route   POST /api/v1/Inspection
// @access  Public
exports.createInspection = asyncHandler(async (req, res, next) => {
  // Zone is auto-populated by autoPopulateZone middleware
  req.body.createdBy = req.user._id;

  if (req.files && req.files.docs) {
    for (const doc of req.files.docs) {
      const file = doc;
      // make sure that the file is a pdf
      if (file.mimetype !== "application/pdf") {
        return next(new ErrorResponse(`Please upload a pdf file`, 400));
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please Upload a pdf file less than ${
              process.env.MAX_FILE_UPLOAD / 1000000
            }mb for ${file.originalname}`,
            400
          )
        );
      }
      var filenames = JSON.parse(req.body.filenames);
      for (const key in filenames) {
        if (
          filenames.hasOwnProperty(key) &&
          filenames[key] === file.originalname
        ) {
          var newname = key;
        }
      }

      if (newname === "bankStatement") {
        var fileNewName = "Bank Statement";
      } else if (newname === "taxDoc") {
        var fileNewName = "Tax Clearance Certificate";
      } else if (newname === "cacDoc") {
        var fileNewName = "CAC Certificate";
      } else if (newname === "idCard") {
        var fileNewName = "ID Card";
      }

      const docs = await uploadToS3({
        file: doc,
        folderName: req.body.name,
        name: fileNewName,
      });

      req.body[newname] = docs;
    }
  }

  req.body.createdBy = req.user._id;

  const inspection = await Inspection.create(req.body);

  let date = new Date(req.body.date);

  date = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const message = `Your building at ${req.body.building} has been scheduled for an inspection on ${date}. Please make your building available. Thanks`;

  const opt = { phoneNo: req.body.phoneNo, message };

  sendSms(opt);

  res.status(201).json({
    success: true,
    data: inspection,
  });
});

// @desc    Update Inspection details
// @route   PUT /api/v1/Inspection/:id
// @access  Private
exports.updateInspection = asyncHandler(async (req, res, next) => {
  var inspection = await Inspection.findById(req.params.id);

  if (req.files && req.files.docs) {
    for (const doc of req.files.docs) {
      const file = doc;
      // make sure that the file is a pdf
      if (file.mimetype !== "application/pdf") {
        return next(new ErrorResponse(`Please upload a pdf file`, 400));
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please Upload a pdf file less than ${
              process.env.MAX_FILE_UPLOAD / 1000000
            }mb for ${file.originalname}`,
            400
          )
        );
      }
      var filenames = JSON.parse(req.body.filenames);
      for (const key in filenames) {
        if (
          filenames.hasOwnProperty(key) &&
          filenames[key] === file.originalname
        ) {
          var newname = key;
        }
      }

      if (newname === "bankStatement") {
        var fileNewName = "Bank Statement";
      } else if (newname === "taxDoc") {
        var fileNewName = "Tax Clearance Certificate";
      } else if (newname === "cacDoc") {
        var fileNewName = "CAC Certificate";
      } else if (newname === "idCard") {
        var fileNewName = "ID Card";
      }

      const docs = await uploadToS3({
        file: doc,
        folderName: inspection.name,
        name: fileNewName,
      });

      req.body[newname] = docs;
    }
  }

  inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate(req.query.populate);

  res.status(200).json({
    success: true,
    data: inspection,
  });
});

// @desc    Delete Inspection
// @route   DELETE /api/v1/Inspection/:id
// @access  Private/Admin
exports.deleteInspection = asyncHandler(async (req, res, next) => {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) {
    return next(
      new ErrorResponse(`Inspection not found with id of ${req.params.id}`, 404)
    );
  }

  await Inspection.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get inspection number for the month
// @route   GET /api/v1/inspection/stats
// @access  Private/Admin
exports.getInspectionsMonth = asyncHandler(async (req, res, next) => {
  const dateBounds = getDateBounds(req.query);

  const currInspection = await Inspection.find({
    createdAt: {
      // $gte: dateBounds.startOfMonth.toDate(),
      $lte: dateBounds.endOfMonth.toDate(),
    },
  }).select("name");

  const currentInspection = currInspection ? currInspection.length : 0;

  const lastInspection = await Inspection.find({
    createdAt: {
      // $gte: dateBounds.startOfLastMonth.toDate(),
      $lte: dateBounds.endOfLastMonth.toDate(),
    },
    status: "success",
  }).select("name");

  const lastInspections = lastInspection ? lastInspection.length : 0;

  const inspectionRise =
    lastInspections === 0
      ? 0
      : Math.floor(
          ((currentInspection - lastInspections) / lastInspections) * 100
        );

  res.status(200).json({
    success: true,
    data: {
      inspectionRise,
      currentInspection,
      month: dateBounds.month,
    },
  });
});

// @desc    Get all Inspection stats
// @route   GET /api/v1/Inspection/:id
// @access  Private / admin
exports.getInspectionStats = asyncHandler(async (req, res, next) => {
  const inspection = await Inspection.find(req.query);
  var total = 0;
  var revenue = 0;
  if (inspection) {
    total = inspection.length;
    inspection.forEach((element) => {
      revenue += element.price;
    });
  }

  res.status(200).json({
    success: true,
    data: { total, revenue },
  });
});

// @desc    Get all Inspection stats
// @route   GET /api/v1/Inspection/stat/pie
// @access  Private / admin
exports.getInspectionStatsPie = asyncHandler(async (req, res, next) => {
  const inspection = await Inspection.find(req.query);
  var sortedData = {
    pending: [0],
    complete: [0],
    missed: [0],
  };

  var data = [];
  const date = new Date();

  if (inspection) {
    inspection.forEach(async (dn) => {
      var amount = 1;
      let val = dn.complete;
      if (dn.date < date && val === "pending") {
        val = "missed";
        await Inspection.findByIdAndUpdate(
          dn._id,
          { complete: val },
          {
            new: true,
            runValidators: true,
          }
        );
      }
      if (sortedData.hasOwnProperty(val)) {
        sortedData[val] = [...sortedData[val], amount];
      } else {
        sortedData[val] = [amount];
      }
    });
  }

  for (const key in sortedData) {
    if (sortedData.hasOwnProperty(key)) {
      const value = sortedData[key];
      const sum = value.reduce((accumulator, currentValue) => {
        const total = accumulator + currentValue;
        const acuu = Math.round(total * 100) / 100;
        return acuu;
      }, 0);
      data.push({ name: key, price: sum });
    }
  }

  const total = data.reduce((sum, item) => sum + item.price, 0);

  data.sort((a, b) => a.price - b.price);

  let cumula = 0;
  data = data.map((item) => {
    cumula += item.price;
    return {
      ...item,
      percentage: (cumula / total) * 100,
      total,
    };
  });

  data.sort((a, b) => b.percentage - a.percentage);

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Get all Inspection stats
// @route   GET /api/v1/Inspection/day
// @access  Private / admin
exports.getInspectionByDay = asyncHandler(async (req, res, next) => {
  const dateBounds = getDateBounds();

  const curr = await Inspection.find({
    date: {
      $gte: dateBounds.startOfMonth.toDate(),
      // $lte: dateBounds.endOfMonth.toDate(),
    },
    ...req.query,
  });
  var sortedData = {};

  var data = [];

  if (curr) {
    curr.forEach((dn) => {
      const dayt = new Date(dn.date);
      const val = dayt.getDate();
      if (sortedData.hasOwnProperty(val)) {
        sortedData[val] = [...sortedData[val], dn];
      } else {
        sortedData[val] = [dn];
      }
    });
  }

  res.status(200).json({
    success: true,
    data: sortedData,
  });
});
