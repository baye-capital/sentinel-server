const express = require("express");

const {
  getBuildings,
  getBuilding,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} = require("../controllers/building");

const Building = require("../models/Building");

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
 * /api/v1/building:
 *   post:
 *     summary: Create a new building record
 *     tags: [Building]
 *     description: Create building record. Zone is auto-populated.
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               status:
 *                 type: number
 *     responses:
 *       201:
 *         description: Building created
 *   get:
 *     summary: Get all buildings (zone-filtered)
 *     tags: [Building]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of buildings
 */
router.post("/", observerReadOnly, autoPopulateZone, createBuilding);

router.use(protect, lastActive);
router.get("/", filterByZone, advancedResults(Building), getBuildings);
/**
 * @swagger
 * /api/v1/building/{id}:
 *   get:
 *     summary: Get building by ID
 *     tags: [Building]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Building details
 *   put:
 *     summary: Update building
 *     tags: [Building]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Building updated
 *   delete:
 *     summary: Delete building (State Admin only)
 *     tags: [Building]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Building deleted
 */
router
  .route("/:id")
  .get(filterByZone, getBuilding)
  .put(observerReadOnly, filterByZone, updateBuilding)
  .delete(authorize("state admin"), filterByZone, deleteBuilding);

module.exports = router;
