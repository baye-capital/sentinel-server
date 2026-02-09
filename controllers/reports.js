const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Report = require("../models/Report");
const Booking = require("../models/Booking");
const { generateExcelReport, REPORT_CONFIGS, PERIOD_LABELS } = require("../utils/excelGenerator");
const moment = require("moment-timezone");
const path = require("path");
const fs = require("fs");

/**
 * Calculate date range based on period and parameters
 */
function calculateDateRange(period, year, month, week, day) {
  const timezone = "Africa/Lagos";
  let startDate, endDate;

  switch (period) {
    case "daily":
      // If specific day provided, use it; otherwise use today
      if (day) {
        startDate = moment.tz(day, timezone).startOf("day");
        endDate = moment.tz(day, timezone).endOf("day");
      } else {
        startDate = moment.tz(timezone).startOf("day");
        endDate = moment.tz(timezone).endOf("day");
      }
      break;

    case "weekly":
      if (week) {
        // Week number provided (1-52)
        startDate = moment.tz(timezone).year(year).week(week).startOf("week");
        endDate = moment.tz(timezone).year(year).week(week).endOf("week");
      } else {
        // Current week
        startDate = moment.tz(timezone).startOf("week");
        endDate = moment.tz(timezone).endOf("week");
      }
      break;

    case "monthly":
      if (month !== undefined) {
        // Month provided (0-11 or 1-12)
        const monthIndex = month > 0 && month <= 12 ? month - 1 : month;
        startDate = moment.tz(timezone).year(year).month(monthIndex).startOf("month");
        endDate = moment.tz(timezone).year(year).month(monthIndex).endOf("month");
      } else {
        // Current month
        startDate = moment.tz(timezone).startOf("month");
        endDate = moment.tz(timezone).endOf("month");
      }
      break;

    case "yearly":
      startDate = moment.tz(timezone).year(year).startOf("year");
      endDate = moment.tz(timezone).year(year).endOf("year");
      break;

    default:
      throw new Error(`Invalid period: ${period}`);
  }

  return {
    startDate: startDate.toDate(),
    endDate: endDate.toDate(),
  };
}

/**
 * Generate report name
 */
function generateReportName(reportType, period, zone, startDate, endDate) {
  const config = REPORT_CONFIGS[reportType];
  const periodLabel = PERIOD_LABELS[period];
  const zoneLabel = zone === "all" ? "All Zones" : `Zone ${zone}`;
  const dateStr = moment(startDate).format("YYYY-MM-DD");
  const endDateStr = moment(endDate).format("YYYY-MM-DD");
  
  return `${config.title} - ${periodLabel} - ${zoneLabel} (${dateStr} to ${endDateStr})`;
}

/**
 * Build zone filter based on user role and requested zone
 */
function buildZoneFilter(user, requestedZone) {
  // State Admin and Observer can see all zones
  if (user.role === "state admin" || user.role === "observer") {
    if (requestedZone && requestedZone !== "all") {
      return { zone: requestedZone };
    }
    return {}; // No zone filter - all zones
  }

  // Zonal Head - can see their zone + annex
  if (user.role === "zonal head") {
    const baseZone = user.zone.replace("annex", "");
    if (requestedZone && requestedZone !== "all") {
      // Check if requested zone is within their access
      const allowedZones = [user.zone, `${baseZone}annex`, baseZone];
      if (!allowedZones.includes(requestedZone)) {
        return { zone: user.zone }; // Fall back to their zone
      }
      return { zone: requestedZone };
    }
    return {
      $or: [
        { zone: user.zone },
        { zone: `${baseZone}annex` },
        ...(user.zone.includes("annex") ? [{ zone: baseZone }] : []),
      ],
    };
  }

  // Booking Officer and others - only their zone
  return { zone: user.zone };
}

// @desc    Generate a new report
// @route   POST /api/v1/reports/generate
// @access  Private (booking officer+)
exports.generateReport = asyncHandler(async (req, res, next) => {
  const {
    reportType,
    period,
    year = new Date().getFullYear(),
    month,
    week,
    day,
    zone = "all",
    syncPayments = false,
  } = req.body;

  // Validate report type
  if (!REPORT_CONFIGS[reportType]) {
    return next(
      new ErrorResponse(
        `Invalid report type. Must be one of: ${Object.keys(REPORT_CONFIGS).join(", ")}`,
        400
      )
    );
  }

  // Validate period
  if (!["daily", "weekly", "monthly", "yearly"].includes(period)) {
    return next(
      new ErrorResponse(
        "Invalid period. Must be: daily, weekly, monthly, or yearly",
        400
      )
    );
  }

  // Calculate date range
  let dateRange;
  try {
    dateRange = calculateDateRange(period, year, month, week, day);
  } catch (err) {
    return next(new ErrorResponse(err.message, 400));
  }

  const { startDate, endDate } = dateRange;

  // Build zone filter
  const zoneFilter = buildZoneFilter(req.user, zone);

  // Build payment filter based on report type
  let paymentFilter = {};
  if (reportType === "bp") {
    paymentFilter = { paid: true };
  } else if (reportType === "unp") {
    paymentFilter = { paid: false };
  }

  // Create report record
  const report = await Report.create({
    name: generateReportName(reportType, period, zone, startDate, endDate),
    reportType,
    period,
    startDate,
    endDate,
    year,
    zone: zone || "all",
    generatedBy: req.user._id,
    status: "generating",
  });

  try {
    // Fetch bookings with filters
    const query = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      ...zoneFilter,
      ...paymentFilter,
    };

    const bookings = await Booking.find(query)
      .sort({ createdAt: 1 })
      .lean();

    // Generate Excel file
    const result = await generateExcelReport({
      bookings,
      reportType,
      period,
      startDate,
      endDate,
      zone,
      generatedBy: req.user.name || req.user.email,
    });

    // Update report with results
    report.fileUrl = result.fileUrl;
    report.fileName = result.fileName;
    report.summary = result.summary;
    report.status = "completed";
    report.generatedAt = new Date();
    await report.save();

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    // Update report with error
    report.status = "failed";
    report.error = error.message;
    await report.save();

    return next(new ErrorResponse(`Report generation failed: ${error.message}`, 500));
  }
});

// @desc    Get all reports
// @route   GET /api/v1/reports
// @access  Private (booking officer+)
exports.getReports = asyncHandler(async (req, res, next) => {
  const { reportType, period, zone, status, page = 1, limit = 25 } = req.query;

  // Build query
  const query = {};

  if (reportType) query.reportType = reportType;
  if (period) query.period = period;
  if (zone) query.zone = zone;
  if (status) query.status = status;

  // Non-admins can only see their own reports
  if (req.user.role !== "state admin") {
    query.generatedBy = req.user._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reports = await Report.find(query)
    .populate("generatedBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Report.countDocuments(query);

  res.status(200).json({
    success: true,
    count: reports.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
    data: reports,
  });
});

// @desc    Get single report
// @route   GET /api/v1/reports/:id
// @access  Private (booking officer+)
exports.getReport = asyncHandler(async (req, res, next) => {
  const query = { _id: req.params.id };

  // Non-admins can only see their own reports
  if (req.user.role !== "state admin") {
    query.generatedBy = req.user._id;
  }

  const report = await Report.findOne(query).populate("generatedBy", "name email");

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});

// @desc    Download report file
// @route   GET /api/v1/reports/:id/download
// @access  Private (booking officer+)
exports.downloadReport = asyncHandler(async (req, res, next) => {
  const query = { _id: req.params.id };

  // Non-admins can only download their own reports
  if (req.user.role !== "state admin") {
    query.generatedBy = req.user._id;
  }

  const report = await Report.findOne(query);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  if (report.status !== "completed") {
    return next(new ErrorResponse(`Report is not ready for download. Status: ${report.status}`, 400));
  }

  if (!report.fileUrl) {
    return next(new ErrorResponse("Report file not found", 404));
  }

  // If it's an S3 URL, redirect to it
  if (report.fileUrl.startsWith("http")) {
    return res.redirect(report.fileUrl);
  }

  // If it's a local file, send it
  const filePath = path.join(__dirname, "..", report.fileUrl);
  if (!fs.existsSync(filePath)) {
    return next(new ErrorResponse("Report file not found on server", 404));
  }

  res.download(filePath, report.fileName);
});

// @desc    Delete report
// @route   DELETE /api/v1/reports/:id
// @access  Private (state admin only)
exports.deleteReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  await Report.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get report statistics
// @route   GET /api/v1/reports/stats
// @access  Private (booking officer+)
exports.getReportStats = asyncHandler(async (req, res, next) => {
  const query = {};

  // Non-admins can only see their own stats
  if (req.user.role !== "state admin") {
    query.generatedBy = req.user._id;
  }

  const stats = await Report.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$reportType",
        count: { $sum: 1 },
        totalRecords: { $sum: "$summary.totalRecords" },
        totalAmount: { $sum: "$summary.totalAmount" },
      },
    },
  ]);

  const byStatus = await Report.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      byType: stats,
      byStatus,
    },
  });
});

// @desc    Get available periods for report generation
// @route   GET /api/v1/reports/periods
// @access  Private
exports.getAvailablePeriods = asyncHandler(async (req, res, next) => {
  const { year = new Date().getFullYear() } = req.query;
  const timezone = "Africa/Lagos";

  // Get weeks for the year
  const weeks = [];
  for (let w = 1; w <= 52; w++) {
    const weekStart = moment.tz(timezone).year(year).week(w).startOf("week");
    const weekEnd = moment.tz(timezone).year(year).week(w).endOf("week");
    weeks.push({
      week: w,
      label: `Week ${w}`,
      range: `${weekStart.format("MMM D")} - ${weekEnd.format("MMM D, YYYY")}`,
    });
  }

  // Get months
  const months = moment.months().map((name, index) => ({
    month: index + 1,
    name,
    label: `${name} ${year}`,
  }));

  res.status(200).json({
    success: true,
    data: {
      year: parseInt(year),
      reportTypes: Object.keys(REPORT_CONFIGS).map((key) => ({
        value: key,
        label: REPORT_CONFIGS[key].title,
      })),
      periods: ["daily", "weekly", "monthly", "yearly"],
      weeks,
      months,
    },
  });
});
