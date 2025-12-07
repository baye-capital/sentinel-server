const express = require("express");
const multer = require("multer");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  sendInvite,
  acceptInvite,
  getUserStats,
  getAllStats,
  viewInvite,
} = require("../controllers/users");
const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024 },
}).fields([
  {
    name: "avatar",
    maxCount: 1,
  },
]);

const User = require("../models/User");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const { observerReadOnly, filterByZone } = require("../middleware/roleFilter");
const advancedResults = require("../middleware/advancedResults");

router.use(protect, lastActive);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user (State Admin only)
 *     tags: [Users]
 *     description: Only State Admins can create new users. Can include avatar upload.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - role
 *               - zone
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [state admin, zonal head, booking officer, operator, observer]
 *               zone:
 *                 type: string
 *               state:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.post("/", authorize("state admin"), observerReadOnly, upload, createUser);
router.get(
  "/",
  authorize("state admin", "zonal head"),
  filterByZone,
  advancedResults(User),
  getUsers
);

/**
 * @swagger
 * /api/v1/users/invite:
 *   post:
 *     summary: Send user invitation (State Admin only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Invitation sent
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/invite", authorize("state admin"), sendInvite);

/**
 * @swagger
 * /api/v1/users/invite/{resettoken}:
 *   post:
 *     summary: Accept user invitation
 *     tags: [Users]
 *     security: []
 *     parameters:
 *       - name: resettoken
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation accepted
 *   get:
 *     summary: View invitation details
 *     tags: [Users]
 *     security: []
 *     parameters:
 *       - name: resettoken
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation details
 */
router.post("/invite/:resettoken", acceptInvite);
router.get("/invite/:resettoken", viewInvite);

/**
 * @swagger
 * /api/v1/users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get("/:id/stats", getUserStats);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get all statistics
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: System statistics
 */
router.get("/stats", getAllStats);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user (State Admin only)
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router
  .route("/:id")
  .get(getUser)
  .put(updateUser)
  .delete(authorize("state admin", "zonal head"), deleteUser);

module.exports = router;
