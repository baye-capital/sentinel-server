const express = require("express");
const multer = require("multer");
const {
  getCollisions,
  getCollision,
  createCollision,
  updateCollision,
  deleteCollision,
} = require("../controllers/collision");
const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 20 * 1024 * 1024 },
}).fields([
  {
    name: "img",
    maxCount: 1,
  },
  {
    name: "vid",
    maxCount: 1,
  },
  {
    name: "driverImg",
    maxCount: 10,
  },
  {
    name: "vehicleImg",
    maxCount: 10,
  },
]);

const Collision = require("../models/Collision");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const {
  filterByZone,
  observerReadOnly,
  autoPopulateZone,
  canDownloadAccidentReports,
} = require("../middleware/roleFilter");
const advancedResults = require("../middleware/advancedResults");

router.use(protect, lastActive);

/**
 * @swagger
 * /api/v1/collision:
 *   post:
 *     summary: Create a new collision/accident report
 *     tags: [Collisions]
 *     description: Create accident report. Zone is auto-populated. Observers cannot create. Can include images and videos.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               zone:
 *                 type: string
 *                 description: Auto-populated from user's zone
 *               location:
 *                 type: string
 *                 example: Lekki-Epe Expressway
 *               desc:
 *                 type: string
 *                 example: Head-on collision
 *               state:
 *                 type: string
 *                 example: Lagos
 *               noOfCars:
 *                 type: number
 *                 example: 2
 *               noOfInjuries:
 *                 type: number
 *                 example: 3
 *               noOfFatalities:
 *                 type: number
 *                 example: 0
 *               vehicle:
 *                 type: string
 *                 description: JSON string of vehicle array
 *               witness:
 *                 type: string
 *                 description: JSON string of witness array
 *               img:
 *                 type: string
 *                 format: binary
 *                 description: Photo evidence
 *               vid:
 *                 type: string
 *                 format: binary
 *                 description: Video evidence
 *               driverImg:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Driver images (up to 10)
 *               vehicleImg:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Vehicle images (up to 10)
 *     responses:
 *       201:
 *         description: Collision report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Collision'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   get:
 *     summary: Get all collision reports (zone-filtered)
 *     tags: [Collisions]
 *     description: |
 *       Get collision reports filtered by user's role and zone.
 *       Download access restricted to State Admin and Zonal Head.
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/sortParam'
 *       - $ref: '#/components/parameters/selectParam'
 *       - name: zone
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of collision reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: number
 *                 count:
 *                   type: number
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collision'
 */
router.post("/", observerReadOnly, upload, autoPopulateZone, createCollision);

router.get("/", filterByZone, advancedResults(Collision), getCollisions);

/**
 * @swagger
 * /api/v1/collision/{id}:
 *   get:
 *     summary: Get a single collision report by ID
 *     tags: [Collisions]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Collision report details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Collision'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a collision report
 *     tags: [Collisions]
 *     description: Update collision details. Zone cannot be changed by non-admins. Observers cannot update.
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Collision'
 *     responses:
 *       200:
 *         description: Collision updated successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete a collision report (State Admin only)
 *     tags: [Collisions]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Collision deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router
  .route("/:id")
  .get(filterByZone, getCollision)
  .put(observerReadOnly, filterByZone, updateCollision)
  .delete(authorize("state admin"), filterByZone, deleteCollision);

module.exports = router;
