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
const advancedResults = require("../middleware/advancedResults");

router.post("/", createFire);

router.use(protect, lastActive);
router.get("/stat", getFireStats);
router.get("/", advancedResults(Fire), getFires);
router
  .route("/:id")
  .get(getFire)
  .put(updateFire)
  .delete(authorize("admin"), deleteFire);

module.exports = router;
