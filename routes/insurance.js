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
  getInsurances,
  getInsurance,
  createInsurance,
  updateInsurance,
  deleteInsurance,
  getInsurancesGraph,
  getInsuranceStats,
  getInsuranceStatsBar,
  getInsuranceStatsPie,
} = require("../controllers/insurance");

const Insurance = require("../models/Insurance");

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
 * /api/v1/insurance:
 *   post:
 *     summary: Create a new insurance policy
 *     tags: [Insurance]
 *     description: Create insurance policy. Zone is auto-populated. Can include document uploads.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               policy:
 *                 type: string
 *                 enum: [Occupiers Liability Insurance, Public Liability Insurance]
 *               buildingNo:
 *                 type: string
 *               area:
 *                 type: string
 *               price:
 *                 type: number
 *               address:
 *                 type: string
 *               state:
 *                 type: string
 *               docs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Insurance created
 *   get:
 *     summary: Get all insurance policies (zone-filtered)
 *     tags: [Insurance]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of insurance policies
 */
router.post("/", observerReadOnly, upload, autoPopulateZone, createInsurance);

/**
 * @swagger
 * /api/v1/insurance/stat:
 *   get:
 *     summary: Get insurance statistics
 *     tags: [Insurance]
 *     responses:
 *       200:
 *         description: Insurance statistics
 */
router.get("/stat", filterByZone, getInsuranceStats);
/**
 * @swagger
 * /api/v1/insurance/stat/bar:
 *   get:
 *     summary: Get insurance bar chart statistics
 *     tags: [Insurance]
 *     responses:
 *       200:
 *         description: Bar chart data
 */
router.get("/stat/bar", filterByZone, getInsuranceStatsBar);
/**
 * @swagger
 * /api/v1/insurance/stat/pie:
 *   get:
 *     summary: Get insurance pie chart statistics
 *     tags: [Insurance]
 *     responses:
 *       200:
 *         description: Pie chart data
 */
router.get("/stat/pie", filterByZone, getInsuranceStatsPie);
/**
 * @swagger
 * /api/v1/insurance/graph:
 *   get:
 *     summary: Get insurance graph data
 *     tags: [Insurance]
 *     responses:
 *       200:
 *         description: Graph data
 */
router.get("/graph", filterByZone, getInsurancesGraph);
router.get("/", filterByZone, advancedResults(Insurance), getInsurances);
/**
 * @swagger
 * /api/v1/insurance/{id}:
 *   get:
 *     summary: Get insurance by ID
 *     tags: [Insurance]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Insurance details
 *   put:
 *     summary: Update insurance
 *     tags: [Insurance]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Insurance updated
 *   delete:
 *     summary: Delete insurance (State Admin only)
 *     tags: [Insurance]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Insurance deleted
 */
router
  .route("/:id")
  .get(filterByZone, getInsurance)
  .put(observerReadOnly, filterByZone, upload, updateInsurance)
  .delete(authorize("state admin"), filterByZone, deleteInsurance);

module.exports = router;
  