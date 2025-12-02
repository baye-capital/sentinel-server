const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Collision = require("../models/Collision");
const Inspection = require("../models/Inspection");
const { uploadToS3 } = require("../utils/fileUploadService");
const { parseFieldIfString } = require("../utils/dateHandler");

// @desc    Get All Collisions
// @route   GET /api/v1/Collision
// @access  Private / admin
exports.getCollisions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Collision
// @route   GET /api/v1/Collision/:id
// @access  Private / admin
exports.getCollision = asyncHandler(async (req, res, next) => {
  const collision = await Collision.findById(req.params.id).populate(
    req.query.populate
  );
  if (!collision) {
    return next(
      new ErrorResponse(`Collision not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: collision,
  });
});

// @desc    Create Collision
// @route   POST /api/v1/Collision
// @access  Public
exports.createCollision = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;

  if (req.files.img) {
    const file = req.files.img[0];
    // make sure that the image is a photo
    if (!file.mimetype.startsWith("image")) {
      return next(
        new ErrorResponse(`Please upload an image file for Image evidence`, 400)
      );
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please Upload an image file less than ${
            process.env.MAX_FILE_UPLOAD / 1000000
          }mb`,
          400
        )
      );
    }
    const timestamp = Date.now();

    const img = await uploadToS3({
      file: req.files.img,
      folderName: "photo evidence",
      name: `${timestamp}_${file.originalname}`,
    });
    if (img) {
      req.body.img = img[0];
    }
  }

  if (req.files.vid) {
    const file = req.files.vid[0];
    // make sure that the file is a video
    if (!file.mimetype.startsWith("video")) {
      return next(
        new ErrorResponse(`Please upload an video file for video evidence`, 400)
      );
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please Upload an video file less than ${
            process.env.MAX_FILE_UPLOAD / 1000000
          }mb`,
          400
        )
      );
    }
    const timestamp = Date.now();

    const vid = await uploadToS3({
      file: req.files.vid,
      folderName: "video evidence",
      name: `${timestamp}_${file.originalname}`,
    });
    if (vid) {
      req.body.vid = vid[0];
    }
  }

  if (req.files.driverImg) {
    req.files.driverImg.forEach(async (el) => {
      const file = el;
      // make sure that the image is a photo
      if (!file.mimetype.startsWith("image")) {
        return next(
          new ErrorResponse(`Please upload an image file for driver image`, 400)
        );
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please Upload an image file less than ${
              process.env.MAX_FILE_UPLOAD / 1000000
            }mb`,
            400
          )
        );
      }
      const timestamp = Date.now();

      const img = await uploadToS3({
        file: el,
        folderName: "driver image",
        name: `${timestamp}_${file.originalname}`,
      });
      if (img) {
        let vehicles = req.body.vehicle;

        let vehicle = vehicles.find((v) => v.plate === el.originalname);

        if (vehicle) {
          vehicle.driverImg = img[0];
        }
      }
    });
  }

  if (req.files.vehicleImg) {
    req.files.vehicleImg.forEach(async (el) => {
      const file = el;
      // make sure that the image is a photo
      if (!file.mimetype.startsWith("image")) {
        return next(
          new ErrorResponse(`Please upload an image file for driver image`, 400)
        );
      }

      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new ErrorResponse(
            `Please Upload an image file less than ${
              process.env.MAX_FILE_UPLOAD / 1000000
            }mb`,
            400
          )
        );
      }
      const timestamp = Date.now();

      const img = await uploadToS3({
        file: el,
        folderName: "driver image",
        name: `${timestamp}_${file.originalname}`,
      });
      if (img) {
        let vehicles = req.body.vehicle;

        let vehicle = vehicles.find((v) => v.plate === el.originalname);

        if (vehicle) {
          vehicle.vehicleImg = img[0];
        }
      }
    });
  }

  req.body.vid = "";
  req.body.vehicle = parseFieldIfString(req.body.vehicle);
  req.body.witness = parseFieldIfString(req.body.witness);
  req.body.officer = parseFieldIfString(req.body.officer);
  req.body.createdAt = new Date(JSON.parse(req.body.createdAt));

  const collision = await Collision.create(req.body);

  res.status(201).json({
    success: true,
    data: collision,
  });
});

// @desc    Update Collision details
// @route   PUT /api/v1/Collision/:id
// @access  Private
exports.updateCollision = asyncHandler(async (req, res, next) => {
  var collision = await Collision.findById(req.params.id).populate(
    "inspection"
  );

  if (!collision) {
    return next(
      new ErrorResponse(`Collision not found with id of ${req.params.id}`, 404)
    );
  }

  if (req.body.comment || req.body.requirement) {
    await Inspection.findByIdAndUpdate(
      collision.inspection._id,
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

  collision = await Collision.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: collision,
  });
});

// @desc    Delete Collision
// @route   DELETE /api/v1/Collision/:id
// @access  Private/Admin
exports.deleteCollision = asyncHandler(async (req, res, next) => {
  const collision = await Collision.findById(req.params.id);
  if (!collision) {
    return next(
      new ErrorResponse(`Collision not found with id of ${req.params.id}`, 404)
    );
  }

  await Collision.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
