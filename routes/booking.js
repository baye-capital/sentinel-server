const express = require("express");
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  bookingStat,
  bookingRev,
  checkPayment,
  checkSinglePayment,
} = require("../controllers/booking");

const Booking = require("../models/Booking");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const {
  filterByZone,
  observerReadOnly,
  autoPopulateZone,
  autoPopulateUnit,
  canDownloadBookingReports,
} = require("../middleware/roleFilter");
const advancedResults = require("../middleware/advancedResults");

router.use(protect, lastActive);

/**
 * @swagger
 * /api/v1/booking:
 *   post:
 *     summary: Create a new booking (traffic offense)
 *     tags: [Bookings]
 *     description: Create a booking/citation. Zone and Unit are auto-populated for non-admin users. Observers cannot create bookings.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phoneNo
 *               - offence
 *               - price
 *             properties:
 *               license:
 *                 type: string
 *                 example: ABC123456
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phoneNo:
 *                 type: string
 *                 example: +2348012345678
 *               registration:
 *                 type: string
 *                 example: ABC-123-XY
 *               color:
 *                 type: string
 *                 example: Blue
 *               make:
 *                 type: string
 *                 example: Toyota
 *               model:
 *                 type: string
 *                 example: Camry
 *               zone:
 *                 type: string
 *                 description: Auto-populated from user's zone (admin can override)
 *                 example: "1"
 *               unit:
 *                 type: string
 *                 description: Auto-populated from user's unit (admin can override)
 *                 enum: [1, 2, 3, 4]
 *               location:
 *                 type: string
 *                 example: Ikeja
 *               offence:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *                     penalty:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     mdasId:
 *                       type: number
 *               price:
 *                 type: number
 *                 example: 5000
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/", observerReadOnly, autoPopulateZone, autoPopulateUnit, createBooking);

/**
 * @swagger
 * /api/v1/booking:
 *   get:
 *     summary: Get all bookings (zone-filtered by role)
 *     tags: [Bookings]
 *     description: |
 *       Get bookings filtered by user's role and zone:
 *       - State Admin: All bookings
 *       - Zonal Head: Bookings from their zone + annex
 *       - Booking Officer: Only their own bookings in their zone
 *       - Observer: All bookings (read-only)
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/sortParam'
 *       - $ref: '#/components/parameters/selectParam'
 *       - name: paid
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by payment status
 *       - name: zone
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by zone
 *     responses:
 *       200:
 *         description: List of bookings
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
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", filterByZone, advancedResults(Booking), getBookings);

/**
 * @swagger
 * /api/v1/booking/stat:
 *   get:
 *     summary: Get booking statistics (zone-filtered)
 *     tags: [Bookings]
 *     description: Returns booking counts for today, week, month, and year filtered by user's zone
 *     responses:
 *       200:
 *         description: Booking statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: number
 *                     week:
 *                       type: number
 *                     month:
 *                       type: number
 *                     year:
 *                       type: number
 */
router.get("/stat", filterByZone, bookingStat);

/**
 * @swagger
 * /api/v1/booking/rev:
 *   get:
 *     summary: Get booking revenue statistics (zone-filtered)
 *     tags: [Bookings]
 *     description: Returns revenue totals for today, week, month, and year. Restricted to Booking Officers and above.
 *     responses:
 *       200:
 *         description: Revenue statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: number
 *                     week:
 *                       type: number
 *                     month:
 *                       type: number
 *                     year:
 *                       type: number
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/rev", filterByZone, canDownloadBookingReports, bookingRev);

/**
 * @swagger
 * /api/v1/booking/check:
 *   get:
 *     summary: Check payment status for bookings
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Payment check results
 */
router.get("/check", filterByZone, checkPayment);

/**
 * @swagger
 * /api/v1/booking/check/{id}:
 *   get:
 *     summary: Check payment status for a single booking
 *     tags: [Bookings]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Single payment check result
 */
router.get("/check/:id", filterByZone, checkSinglePayment);

/**
 * @swagger
 * /api/v1/booking/{id}:
 *   get:
 *     summary: Get a single booking by ID
 *     tags: [Bookings]
 *     description: Get booking details. Zone-filtered based on user role.
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     description: Update booking details. Zone cannot be changed by non-admins. Observers cannot update.
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete a booking (State Admin only)
 *     tags: [Bookings]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router
  .route("/:id")
  .get(filterByZone, getBooking)
  .put(observerReadOnly, filterByZone, updateBooking)
  .delete(authorize("state admin"), filterByZone, deleteBooking);

module.exports = router;
