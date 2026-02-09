const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  // Report identification
  name: {
    type: String,
    required: true,
  },
  reportType: {
    type: String,
    required: true,
    enum: ["snapshot", "fa", "bp", "unp"],
  },

  // Time period
  period: {
    type: String,
    required: true,
    enum: ["daily", "weekly", "monthly", "yearly"],
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },

  // Zone filtering
  zone: {
    type: String,
    enum: [
      "all",
      "1",
      "1annex",
      "2",
      "2annex",
      "3",
      "3annex",
      "4",
      "4annex",
      "5",
      "6",
      "6annex",
      "7",
      "9",
      "10",
      "12",
      "13",
      "14",
      "15",
    ],
    default: "all",
  },

  // Unit filtering
  unit: {
    type: String,
    enum: [
      "all",
      "1",
      "2",
      "3",
      "4",
    ],
    default: "all",
  },

  // File storage
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },

  // Report metadata
  status: {
    type: String,
    enum: ["pending", "generating", "completed", "failed"],
    default: "pending",
  },

  // Summary data (stored for quick access without downloading file)
  summary: {
    totalRecords: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidCount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    unpaidCount: { type: Number, default: 0 },
    unpaidAmount: { type: Number, default: 0 },
  },

  // Audit fields
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  generatedAt: {
    type: Date,
  },
  error: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
ReportSchema.index({ reportType: 1, period: 1, createdAt: -1 });
ReportSchema.index({ generatedBy: 1, createdAt: -1 });
ReportSchema.index({ zone: 1, createdAt: -1 });
ReportSchema.index({ unit: 1, createdAt: -1 });

module.exports = mongoose.model("Report", ReportSchema);
