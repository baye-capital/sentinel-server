const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Insurance = require("../models/Insurance");
const { uploadToS3 } = require("../utils/fileUploadService");
const { getDateBounds } = require("../utils/dateHandler");
const moment = require("moment-timezone");

// @desc    Get All Insurances
// @route   GET /api/v1/Insurance
// @access  Private / admin
exports.getInsurances = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Insurance
// @route   GET /api/v1/Insurance/:id
// @access  Private / admin
exports.getInsurance = asyncHandler(async (req, res, next) => {
  if (req.query.reference === "check") {
    var insurance = await Insurance.findOne({
      reference: req.params.id,
    }).populate(req.query.populate);
  } else {
    insurance = await Insurance.findById(req.params.id).populate(
      req.query.populate
    );
  }

  if (!insurance) {
    return next(new ErrorResponse(`Insurance not found`, 404));
  }

  res.status(200).json({
    success: true,
    data: insurance,
  });
});

// @desc    Create Insurance
// @route   POST /api/v1/Insurance
// @access  Public
exports.createInsurance = asyncHandler(async (req, res, next) => {
  if (req.files?.docs) {
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

  const insurance = await Insurance.create(req.body);

  res.status(201).json({
    success: true,
    data: insurance,
  });
});

// @desc    Update Insurance details
// @route   PUT /api/v1/Insurance/:id
// @access  Private
exports.updateInsurance = asyncHandler(async (req, res, next) => {
  var insurance = await Insurance.findById(req.params.id);

  if (req.files.docs) {
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
        folderName: insurance.name,
        name: fileNewName,
      });

      req.body[newname] = docs;
    }
  }

  insurance = await Insurance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: insurance,
  });
});

// @desc    Delete Insurance
// @route   DELETE /api/v1/Insurance/:id
// @access  Private/Admin
exports.deleteInsurance = asyncHandler(async (req, res, next) => {
  const insurance = await Insurance.findById(req.params.id);
  if (!insurance) {
    return next(
      new ErrorResponse(`Insurance not found with id of ${req.params.id}`, 404)
    );
  }

  await Insurance.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get insurance number for the month
// @route   GET /api/v1/insurance/graph
// @access  Private/Admin
exports.getInsurancesGraph = asyncHandler(async (req, res, next) => {
  const dateBounds = getDateBounds();

  const currInsurance = await Insurance.find({
    createdAt: {
      $gte: dateBounds.startOfYear.toDate(),
      $lte: dateBounds.endOfMonth.toDate(),
    },
    status: "success",
    ...req.query,
  });

  const date = new Date();
  const monthNo = date.getMonth() + 1;
  var data = [];

  for (let i = 0; i < monthNo; i++) {
    const monthDonation = currInsurance.filter((ins) => {
      const date = moment(ins.createdAt).tz("Africa/Lagos");
      if (date.month() === i) {
        return true;
      } else {
        return false;
      }
    });

    const sum = monthDonation.reduce((accumulator, currentValue) => {
      const amount = currentValue.price / 1000;
      const total = accumulator + amount;
      const acuu = Math.round(total);
      return acuu;
    }, 0);
    data.push({
      name: dateBounds.months[i],
      price: monthDonation ? sum : 0,
    });
  }

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Get all Insurance stats
// @route   GET /api/v1/Insurance/stat
// @access  Private / admin
exports.getInsuranceStats = asyncHandler(async (req, res, next) => {
  const insurance = await Insurance.find(req.query);
  var total = 0;
  var revenue = 0;
  var pending = 0;
  if (insurance) {
    insurance.forEach((element) => {
      if (element.status === "success") {
        revenue += element.price;
        total++;
      } else {
        pending++;
      }
    });
  }

  res.status(200).json({
    success: true,
    data: { total, revenue, pending },
  });
});

// @desc    Get all Insurance stats
// @route   GET /api/v1/Insurance/stat/bar
// @access  Private / admin
exports.getInsuranceStatsBar = asyncHandler(async (req, res, next) => {
  const insurance = await Insurance.find({ status: "success", ...req.query });
  var sortedData = {};

  var data = [];
  if (insurance) {
    insurance.forEach((dn) => {
      var amount = dn.price / 1000;
      amount = Math.round(amount * 100) / 100;
      let val = dn.building.name;
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

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Get all Insurance stats
// @route   GET /api/v1/Insurance/stat/pie
// @access  Private / admin
exports.getInsuranceStatsPie = asyncHandler(async (req, res, next) => {
  const insurance = await Insurance.find(req.query);
  var sortedData = {};

  var data = [];
  if (insurance) {
    insurance.forEach((dn) => {
      var amount = dn.price / 1000;
      amount = Math.round(amount * 100) / 100;
      let val = dn.status;
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
