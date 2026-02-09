const express = require("express");
const {
  generateReport,
  getReports,
  getReport,
  downloadReport,
  deleteReport,
  getReportStats,
  getAvailablePeriods,
} = require("../controllers/reports");

const router = express.Router();

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const { canDownloadBookingReports, observerReadOnly } = require("../middleware/roleFilter");

// All routes require authentication
router.use(protect, lastActive);

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         reportType:
 *           type: string
 *           enum: [snapshot, fa, bp, unp]
 *         period:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         year:
 *           type: number
 *         zone:
 *           type: string
 *         fileUrl:
 *           type: string
 *         fileName:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, generating, completed, failed]
 *         summary:
 *           type: object
 *           properties:
 *             totalRecords:
 *               type: number
 *             totalAmount:
 *               type: number
 *             paidCount:
 *               type: number
 *             paidAmount:
 *               type: number
 *             unpaidCount:
 *               type: number
 *             unpaidAmount:
 *               type: number
 *         generatedBy:
 *           type: string
 *         generatedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/reports/generate:
 *   post:
 *     summary: Generate a new report
 *     tags: [Reports]
 *     description: |
 *       Generate an Excel report for bookings data.
 *       
 *       **Report Types:**
 *       - `snapshot` - All bookings (EOD/reconciliation report)
 *       - `fa` - Fines & Amounts (financial summary with paid/unpaid status)
 *       - `bp` - Booked & Paid (only paid bookings)
 *       - `unp` - Unpaid (outstanding bookings with days overdue)
 *       
 *       **Periods:**
 *       - `daily` - Single day (provide `day` param or defaults to today)
 *       - `weekly` - Week range (provide `week` number 1-52)
 *       - `monthly` - Full month (provide `month` 1-12)
 *       - `yearly` - Full year
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - period
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [snapshot, fa, bp, unp]
 *                 example: snapshot
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly]
 *                 example: weekly
 *               year:
 *                 type: number
 *                 example: 2024
 *               month:
 *                 type: number
 *                 description: Month number (1-12) for monthly reports
 *                 example: 7
 *               week:
 *                 type: number
 *                 description: Week number (1-52) for weekly reports
 *                 example: 34
 *               day:
 *                 type: string
 *                 format: date
 *                 description: Specific date for daily reports (YYYY-MM-DD)
 *                 example: "2024-07-08"
 *               zone:
 *                 type: string
 *                 description: Zone filter (admin only can filter by zone, others auto-filtered)
 *                 example: "4"
 *     responses:
 *       201:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: Invalid parameters
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/generate", canDownloadBookingReports, generateReport);

/**
 * @swagger
 * /api/v1/reports/periods:
 *   get:
 *     summary: Get available periods for report generation
 *     tags: [Reports]
 *     description: Returns available report types, periods, weeks, and months for a given year
 *     parameters:
 *       - name: year
 *         in: query
 *         schema:
 *           type: number
 *         description: Year to get periods for (defaults to current year)
 *     responses:
 *       200:
 *         description: Available periods
 */
router.get("/periods", getAvailablePeriods);

/**
 * @swagger
 * /api/v1/reports/stats:
 *   get:
 *     summary: Get report generation statistics
 *     tags: [Reports]
 *     description: Returns statistics about generated reports by type and status
 *     responses:
 *       200:
 *         description: Report statistics
 */
router.get("/stats", getReportStats);

/**
 * @swagger
 * /api/v1/reports:
 *   get:
 *     summary: Get all reports
 *     tags: [Reports]
 *     description: |
 *       Get list of generated reports.
 *       - State Admin: Can see all reports
 *       - Others: Can only see their own reports
 *     parameters:
 *       - name: reportType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [snapshot, fa, bp, unp]
 *         description: Filter by report type
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: Filter by period
 *       - name: zone
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by zone
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, generating, completed, failed]
 *         description: Filter by status
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of reports
 */
router.get("/", canDownloadBookingReports, getReports);

/**
 * @swagger
 * /api/v1/reports/{id}:
 *   get:
 *     summary: Get single report
 *     tags: [Reports]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report details
 *       404:
 *         description: Report not found
 */
router.get("/:id", canDownloadBookingReports, getReport);

/**
 * @swagger
 * /api/v1/reports/{id}/download:
 *   get:
 *     summary: Download report Excel file
 *     tags: [Reports]
 *     description: Download the generated Excel file for a report
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Report not ready for download
 *       404:
 *         description: Report not found
 */
router.get("/:id/download", canDownloadBookingReports, downloadReport);

/**
 * @swagger
 * /api/v1/reports/{id}:
 *   delete:
 *     summary: Delete a report
 *     tags: [Reports]
 *     description: Delete a report (State Admin only)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Report not found
 */
router.delete("/:id", authorize("state admin"), deleteReport);

module.exports = router;
