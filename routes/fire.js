const express = require("express");

const {
  getFires,
  getFire,
  createFire,
  updateFire,
  deleteFire,
  getFiresMonth,
  getFireStats,
} = require("../controllers/fire");

const Fire = require("../models/Fire");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const {
  filterByZone,
  observerReadOnly,
  autoPopulateZone,
} = require("../middleware/roleFilter");
const advancedResults = require("../middleware/advancedResults");

/**
 * @swagger
 * /api/v1/fire:
 *   post:
 *     summary: Create a new fire incident report
 *     tags: [Fire]
 *     description: Create fire incident. Zone is auto-populated.
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               state:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Electrical, Chemical, Structural, Other]
 *               cause:
 *                 type: string
 *               injuries:
 *                 type: number
 *               fatalities:
 *                 type: number
 *     responses:
 *       201:
 *         description: Fire report created
 *   get:
 *     summary: Get all fire incidents (zone-filtered)
 *     tags: [Fire]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of fire incidents
 */
router.post("/", observerReadOnly, autoPopulateZone, createFire);

router.use(protect, lastActive);
/**
 * @swagger
 * /api/v1/fire/stat:
 *   get:
 *     summary: Get fire statistics
 *     tags: [Fire]
 *     responses:
 *       200:
 *         description: Fire statistics
 */
router.get("/stat", filterByZone, getFireStats);
router.get("/", filterByZone, advancedResults(Fire), getFires);
router
  .route("/:id")
  .get(filterByZone, getFire)
  .put(observerReadOnly, filterByZone, updateFire)
  .delete(authorize("state admin"), filterByZone, deleteFire);

module.exports = router;
