const express = require("express");
const multer = require("multer");
const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024 },
  array: true,
}).fields([
  {
    name: "docs",
    maxCount: 4,
  },
]);
const {
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  deleteInspection,
  getInspectionsMonth,
  getInspectionStats,
  getInspectionStatsPie,
  getInspectionByDay,
} = require("../controllers/inspection");

const Inspection = require("../models/Inspection");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const {
  filterByZone,
  observerReadOnly,
  autoPopulateZone,
} = require("../middleware/roleFilter");
const advancedResults = require("../middleware/advancedResults");

router.use(protect, lastActive);

/**
 * @swagger
 * /api/v1/inspection:
 *   post:
 *     summary: Create a new inspection
 *     tags: [Inspections]
 *     description: Create inspection record. Zone is auto-populated.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               building:
 *                 type: string
 *               address:
 *                 type: string
 *               state:
 *                 type: string
 *               price:
 *                 type: number
 *               docs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Inspection created
 *   get:
 *     summary: Get all inspections (zone-filtered)
 *     tags: [Inspections]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of inspections
 */
router.post("/", observerReadOnly, upload, autoPopulateZone, createInspection);
/**
 * @swagger
 * /api/v1/inspection/stat:
 *   get:
 *     summary: Get inspection statistics
 *     tags: [Inspections]
 *     responses:
 *       200:
 *         description: Inspection statistics
 */
router.get("/stat", filterByZone, getInspectionStats);
/**
 * @swagger
 * /api/v1/inspection/stat/pie:
 *   get:
 *     summary: Get inspection pie chart statistics
 *     tags: [Inspections]
 *     responses:
 *       200:
 *         description: Pie chart data
 */
router.get("/stat/pie", filterByZone, getInspectionStatsPie);
/**
 * @swagger
 * /api/v1/inspection/day:
 *   get:
 *     summary: Get inspections by day
 *     tags: [Inspections]
 *     responses:
 *       200:
 *         description: Daily inspection data
 */
router.get("/day", filterByZone, getInspectionByDay);
router.get("/", filterByZone, advancedResults(Inspection), getInspections);
router
  .route("/:id")
  .get(filterByZone, getInspection)
  .put(observerReadOnly, filterByZone, upload, updateInspection)
  .delete(authorize("state admin"), filterByZone, deleteInspection);

module.exports = router;
