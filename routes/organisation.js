const express = require("express");

const {
  getOrganisations,
  getOrganisation,
  createOrganisation,
  updateOrganisation,
  deleteOrganisation,
} = require("../controllers/organisation");

const Organisation = require("../models/Organisation");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const { observerReadOnly } = require("../middleware/roleFilter");
const advancedResults = require("../middleware/advancedResults");

/**
 * @swagger
 * /api/v1/org:
 *   post:
 *     summary: Create a new organisation
 *     tags: [Organisation]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               zone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organisation created
 *   get:
 *     summary: Get all organisations
 *     tags: [Organisation]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of organisations
 */
router.post("/", observerReadOnly, createOrganisation);

router.use(protect, lastActive);
router.get("/", advancedResults(Organisation), getOrganisations);
/**
 * @swagger
 * /api/v1/org/{id}:
 *   get:
 *     summary: Get organisation by ID
 *     tags: [Organisation]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Organisation details
 *   put:
 *     summary: Update organisation
 *     tags: [Organisation]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Organisation updated
 *   delete:
 *     summary: Delete organisation (State Admin only)
 *     tags: [Organisation]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Organisation deleted
 */
router
  .route("/:id")
  .get(getOrganisation)
  .put(observerReadOnly, updateOrganisation)
  .delete(authorize("state admin"), deleteOrganisation);

module.exports = router;
