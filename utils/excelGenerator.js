const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const { uploadToS3 } = require("./fileUploadService");

/**
 * Report type configurations
 */
const REPORT_CONFIGS = {
  snapshot: {
    title: "REVENUE REPORT",
    columns: [
      { header: "S/NO", key: "sno", width: 8 },
      { header: "DATE", key: "date", width: 12 },
      { header: "TICKET NO.", key: "ticketNo", width: 18 },
      { header: "OFFENDER'S NAME", key: "name", width: 25 },
      { header: "OFFENCE", key: "offence", width: 45 },
      { header: "VEHICLE TYPE", key: "vehicleType", width: 15 },
      { header: "NO. PLATE", key: "plate", width: 12 },
      { header: "MODE OF PAYMENT", key: "paymentMode", width: 15 },
      { header: "TELLER NO.", key: "tellerNo", width: 18 },
      { header: "AMOUNT", key: "amount", width: 15 },
    ],
  },
  fa: {
    title: "FINES & AMOUNTS REPORT",
    columns: [
      { header: "S/NO", key: "sno", width: 8 },
      { header: "DATE", key: "date", width: 12 },
      { header: "TICKET NO.", key: "ticketNo", width: 18 },
      { header: "OFFENDER'S NAME", key: "name", width: 25 },
      { header: "OFFENCE", key: "offence", width: 45 },
      { header: "VEHICLE TYPE", key: "vehicleType", width: 15 },
      { header: "NO. PLATE", key: "plate", width: 12 },
      { header: "PAYMENT STATUS", key: "paymentStatus", width: 15 },
      { header: "TELLER NO.", key: "tellerNo", width: 18 },
      { header: "AMOUNT", key: "amount", width: 15 },
    ],
  },
  bp: {
    title: "BOOKED & PAID REPORT",
    columns: [
      { header: "S/NO", key: "sno", width: 8 },
      { header: "DATE", key: "date", width: 12 },
      { header: "TICKET NO.", key: "ticketNo", width: 18 },
      { header: "OFFENDER'S NAME", key: "name", width: 25 },
      { header: "OFFENCE", key: "offence", width: 45 },
      { header: "VEHICLE TYPE", key: "vehicleType", width: 15 },
      { header: "NO. PLATE", key: "plate", width: 12 },
      { header: "MODE OF PAYMENT", key: "paymentMode", width: 15 },
      { header: "TELLER NO.", key: "tellerNo", width: 18 },
      { header: "AMOUNT", key: "amount", width: 15 },
    ],
  },
  unp: {
    title: "UNPAID BOOKINGS REPORT",
    columns: [
      { header: "S/NO", key: "sno", width: 8 },
      { header: "DATE", key: "date", width: 12 },
      { header: "TICKET NO.", key: "ticketNo", width: 18 },
      { header: "OFFENDER'S NAME", key: "name", width: 25 },
      { header: "PHONE NO.", key: "phoneNo", width: 15 },
      { header: "OFFENCE", key: "offence", width: 40 },
      { header: "NO. PLATE", key: "plate", width: 12 },
      { header: "DAYS OVERDUE", key: "daysOverdue", width: 12 },
      { header: "AMOUNT", key: "amount", width: 15 },
    ],
  },
};

/**
 * Period labels for report titles
 */
const PERIOD_LABELS = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

/**
 * Style configurations
 */
const STYLES = {
  header: {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF006400" }, // Dark green
    },
    font: {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    },
    alignment: {
      horizontal: "center",
      vertical: "middle",
    },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  },
  title: {
    font: {
      bold: true,
      size: 14,
      color: { argb: "FF006400" },
    },
    alignment: {
      horizontal: "center",
      vertical: "middle",
    },
  },
  subtotal: {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }, // Light gray
    },
    font: {
      bold: true,
      size: 11,
    },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  },
  data: {
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
    alignment: {
      vertical: "middle",
    },
  },
  grandTotal: {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF006400" },
    },
    font: {
      bold: true,
      size: 12,
      color: { argb: "FFFFFFFF" },
    },
    border: {
      top: { style: "medium" },
      left: { style: "medium" },
      bottom: { style: "medium" },
      right: { style: "medium" },
    },
  },
};

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Calculate days overdue
 */
function calculateDaysOverdue(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Group bookings by date
 */
function groupByDate(bookings) {
  const grouped = {};
  bookings.forEach((booking) => {
    const dateKey = formatDate(booking.createdAt);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(booking);
  });
  return grouped;
}

/**
 * Transform booking to row data based on report type
 */
function transformBookingToRow(booking, reportType, sno) {
  const baseRow = {
    sno,
    date: formatDate(booking.createdAt),
    ticketNo: booking.billRef || booking._id.toString().slice(-10),
    name: booking.name || "N/A",
    offence: booking.offence?.map((o) => o.name).join(", ") || "N/A",
    vehicleType: booking.vehicleType || booking.type || "N/A",
    plate: booking.registration || "N/A",
    amount: booking.price || 0,
  };

  switch (reportType) {
    case "snapshot":
    case "bp":
      return {
        ...baseRow,
        paymentMode: booking.paid ? "ePayment" : "Pending",
        tellerNo: booking.billRef || "N/A",
      };
    case "fa":
      return {
        ...baseRow,
        paymentStatus: booking.paid ? "PAID" : "UNPAID",
        tellerNo: booking.billRef || "N/A",
      };
    case "unp":
      return {
        ...baseRow,
        phoneNo: booking.phoneNo || "N/A",
        daysOverdue: calculateDaysOverdue(booking.createdAt),
      };
    default:
      return baseRow;
  }
}

/**
 * Apply styles to a row
 */
function applyRowStyle(row, style) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    if (style.fill) cell.fill = style.fill;
    if (style.font) cell.font = style.font;
    if (style.alignment) cell.alignment = style.alignment;
    if (style.border) cell.border = style.border;
  });
}

/**
 * Generate Excel report
 */
async function generateExcelReport({
  bookings,
  reportType,
  period,
  startDate,
  endDate,
  zone,
  unit,
  generatedBy,
}) {
  const config = REPORT_CONFIGS[reportType];
  if (!config) {
    throw new Error(`Invalid report type: ${reportType}`);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KASTLEA Sentinel";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Report", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
    },
  });

  // Set columns
  worksheet.columns = config.columns;

  // Add title row
  const periodLabel = PERIOD_LABELS[period];
  let locationLabel;
  if (unit && unit !== "all") {
    locationLabel = `UNIT ${unit.toUpperCase()}`;
  } else if (zone && zone !== "all" && zone !== "multiple") {
    locationLabel = `ZONE ${zone.toUpperCase()}`;
  } else if (zone === "multiple") {
    locationLabel = "MULTIPLE ZONES";
  } else {
    locationLabel = "ALL ZONES";
  }
  const dateRange = `${formatDate(startDate)} TO ${formatDate(endDate)}`;
  const title = `${periodLabel} ${config.title} OF ${locationLabel} FROM ${dateRange}`;

  // Merge cells for title
  const titleRow = worksheet.insertRow(1, [title]);
  worksheet.mergeCells(1, 1, 1, config.columns.length);
  titleRow.height = 30;
  applyRowStyle(titleRow, STYLES.title);

  // Add empty row
  worksheet.insertRow(2, []);

  // Add header row (now at row 3)
  const headerRow = worksheet.getRow(3);
  config.columns.forEach((col, index) => {
    headerRow.getCell(index + 1).value = col.header;
  });
  headerRow.height = 25;
  applyRowStyle(headerRow, STYLES.header);

  // Group bookings by date for subtotals
  const groupedBookings = groupByDate(bookings);
  const sortedDates = Object.keys(groupedBookings).sort();

  let currentRow = 4;
  let globalSno = 1;
  let grandTotal = 0;

  // Summary stats
  const summary = {
    totalRecords: 0,
    totalAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    unpaidCount: 0,
    unpaidAmount: 0,
  };

  // Add data rows grouped by date
  for (const dateKey of sortedDates) {
    const dateBookings = groupedBookings[dateKey];
    let dateTotal = 0;

    // Add bookings for this date
    for (const booking of dateBookings) {
      const rowData = transformBookingToRow(booking, reportType, globalSno);
      const row = worksheet.getRow(currentRow);

      config.columns.forEach((col, index) => {
        const cell = row.getCell(index + 1);
        if (col.key === "amount") {
          cell.value = rowData[col.key];
          cell.numFmt = "#,##0.00";
        } else {
          cell.value = rowData[col.key];
        }
      });

      applyRowStyle(row, STYLES.data);
      row.height = 20;

      dateTotal += rowData.amount || 0;
      grandTotal += rowData.amount || 0;

      // Update summary
      summary.totalRecords++;
      summary.totalAmount += rowData.amount || 0;
      if (booking.paid) {
        summary.paidCount++;
        summary.paidAmount += rowData.amount || 0;
      } else {
        summary.unpaidCount++;
        summary.unpaidAmount += rowData.amount || 0;
      }

      globalSno++;
      currentRow++;
    }

    // Add date subtotal row
    const subtotalRow = worksheet.getRow(currentRow);
    subtotalRow.getCell(1).value = `${dateKey} Total`;
    worksheet.mergeCells(currentRow, 1, currentRow, config.columns.length - 1);
    subtotalRow.getCell(config.columns.length).value = dateTotal;
    subtotalRow.getCell(config.columns.length).numFmt = "#,##0.00";
    applyRowStyle(subtotalRow, STYLES.subtotal);
    subtotalRow.height = 22;
    currentRow++;
  }

  // Add grand total row
  const grandTotalRow = worksheet.getRow(currentRow);
  grandTotalRow.getCell(1).value = "GRAND TOTAL";
  worksheet.mergeCells(currentRow, 1, currentRow, config.columns.length - 1);
  grandTotalRow.getCell(config.columns.length).value = grandTotal;
  grandTotalRow.getCell(config.columns.length).numFmt = "#,##0.00";
  applyRowStyle(grandTotalRow, STYLES.grandTotal);
  grandTotalRow.height = 25;

  // Generate filename
  const timestamp = Date.now();
  let locationPart;
  if (unit && unit !== "all") {
    locationPart = `UNIT_${unit}`;
  } else if (zone && zone !== "all" && zone !== "multiple") {
    locationPart = zone;
  } else if (zone === "multiple") {
    locationPart = "MULTIPLE";
  } else {
    locationPart = "ALL";
  }
  const fileName = `${reportType.toUpperCase()}_${periodLabel}_REPORT_${locationPart}_${formatDate(startDate)}_to_${formatDate(endDate)}_${timestamp}.xlsx`;
  const tempPath = path.join(__dirname, "..", "temp", fileName);

  // Ensure temp directory exists
  const tempDir = path.join(__dirname, "..", "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Write to temp file
  await workbook.xlsx.writeFile(tempPath);

  // Upload to S3
  let fileUrl;
  try {
    const fileBuffer = fs.readFileSync(tempPath);
    fileUrl = await uploadToS3({
      file: {
        path: tempPath,
        mimetype:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        originalname: fileName,
      },
      folderName: "reports",
      name: fileName,
    });
  } catch (uploadError) {
    console.error("S3 upload failed, using local file:", uploadError.message);
    // If S3 fails, we still have the local file
    fileUrl = `/temp/${fileName}`;
  }

  // Clean up temp file if uploaded to S3
  if (fileUrl && !fileUrl.startsWith("/temp/")) {
    try {
      fs.unlinkSync(tempPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  return {
    fileUrl,
    fileName,
    summary,
  };
}

module.exports = {
  generateExcelReport,
  REPORT_CONFIGS,
  PERIOD_LABELS,
};
