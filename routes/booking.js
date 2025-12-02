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
const advancedResults = require("../middleware/advancedResults");

router.use(protect, lastActive);
router.post("/", createBooking);

router.get("/", advancedResults(Booking), getBookings);
router.get("/stat", bookingStat);
router.get("/rev", bookingRev);
router.get("/check", checkPayment);
router.get("/check/:id", checkSinglePayment);
router
  .route("/:id")
  .get(getBooking)
  .put(updateBooking)
  .delete(authorize("admin"), deleteBooking);

module.exports = router;
