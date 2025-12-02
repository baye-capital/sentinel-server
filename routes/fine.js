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
const advancedResults = require("../middleware/advancedResults");

router.post("/", createFine);

router.use(protect, lastActive);
router.get("/stat", getFineStats);
router.get("/", advancedResults(Fine), getFines);
router
  .route("/:id")
  .get(getFine)
  .put(updateFine)
  .delete(authorize("admin"), deleteFine);

module.exports = router;
