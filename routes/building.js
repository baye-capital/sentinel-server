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
const advancedResults = require("../middleware/advancedResults");

router.post("/", createBuilding);

router.use(protect, lastActive);
router.get("/", advancedResults(Building), getBuildings);
router
  .route("/:id")
  .get(getBuilding)
  .put(updateBuilding)
  .delete(authorize("admin"), deleteBuilding);

module.exports = router;
