const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");

// Filter data by zone based on user role
exports.filterByZone = asyncHandler(async (req, res, next) => {
  const { role, zone } = req.user;

  // State Admin - No filters, can see everything
  if (role === "state admin") {
    req.zoneFilter = {};
    return next();
  }

  // Observer - Can see everything but read-only (enforced elsewhere)
  if (role === "observer") {
    req.zoneFilter = {};
    return next();
  }

  // Zonal Head - Filter by zone + annexes
  if (role === "zonal head") {
    const baseZone = zone.replace("annex", ""); // Extract base zone number
    req.zoneFilter = {
      $or: [
        { zone: zone },
        { zone: `${baseZone}annex` }, // Include annex if main zone
        ...(zone.includes("annex") ? [{ zone: baseZone }] : []), // Include main if annex
      ],
    };
    return next();
  }

  // Booking Officer - Filter by zone + own records only
  if (role === "booking officer") {
    req.zoneFilter = {
      zone: zone,
      createdBy: req.user._id, // Only their own records
    };
    return next();
  }

  // Default - restrict to own zone
  req.zoneFilter = { zone: zone };
  next();
});

// Block specific actions for booking officers (no admin access)
exports.blockBookingOfficerAdmin = (req, res, next) => {
  if (req.user.role === "booking officer") {
    return next(
      new ErrorResponse(
        "Booking officers cannot access admin functions",
        403
      )
    );
  }
  next();
};

// Block specific actions for zonal heads (no admin access)
exports.blockZonalHeadAdmin = (req, res, next) => {
  if (req.user.role === "zonal head") {
    return next(
      new ErrorResponse("Zonal heads cannot access admin functions", 403)
    );
  }
  next();
};

// Enforce read-only access for observers
exports.observerReadOnly = (req, res, next) => {
  if (req.user.role === "observer" && req.method !== "GET") {
    return next(
      new ErrorResponse("Observers have read-only access only", 403)
    );
  }
  next();
};

// Restrict accident report downloads to state admin and zonal head only
exports.canDownloadAccidentReports = (req, res, next) => {
  if (!["state admin", "zonal head"].includes(req.user.role)) {
    return next(
      new ErrorResponse(
        "Only State Admins and Zonal Heads can download accident reports",
        403
      )
    );
  }
  next();
};

// Allow booking officers and above to download booking reports
exports.canDownloadBookingReports = (req, res, next) => {
  if (
    !["state admin", "zonal head", "booking officer"].includes(req.user.role)
  ) {
    return next(
      new ErrorResponse("Unauthorized to download booking reports", 403)
    );
  }
  next();
};

// Auto-populate zone from user for non-admins
exports.autoPopulateZone = (req, res, next) => {
  // State admins can set any zone
  if (req.user.role === "state admin") {
    return next();
  }

  // All other roles must use their assigned zone
  req.body.zone = req.user.zone;
  next();
};

// Auto-populate unit from user for non-admins
exports.autoPopulateUnit = (req, res, next) => {
  // State admins can set any unit
  if (req.user.role === "state admin") {
    return next();
  }

  // All other roles must use their assigned unit
  req.body.unit = req.user.unit;
  next();
};
