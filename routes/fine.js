const express = require("express");

const {
  getFines,
  getFine,
  createFine,
  updateFine,
  deleteFine,
  getFinesMonth,
  getFineStats,
} = require("../controllers/fine");

const Fine = require("../models/Fine");

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
 * /api/v1/fine:
 *   post:
 *     summary: Create a new fine
 *     tags: [Fine]
 *     description: Create fine record. Zone is auto-populated.
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
 *               price:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fine created
 *   get:
 *     summary: Get all fines (zone-filtered)
 *     tags: [Fine]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of fines
 */
router.post("/", observerReadOnly, autoPopulateZone, createFine);

router.use(protect, lastActive);
/**
 * @swagger
 * /api/v1/fine/stat:
 *   get:
 *     summary: Get fine statistics
 *     tags: [Fine]
 *     responses:
 *       200:
 *         description: Fine statistics
 */
router.get("/stat", filterByZone, getFineStats);
router.get("/", filterByZone, advancedResults(Fine), getFines);
router
  .route("/:id")
  .get(filterByZone, getFine)
  .put(observerReadOnly, filterByZone, updateFine)
  .delete(authorize("state admin"), filterByZone, deleteFine);

module.exports = router;
