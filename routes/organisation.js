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
const advancedResults = require("../middleware/advancedResults");

router.post("/", createOrganisation);

router.use(protect, lastActive);
router.get("/", advancedResults(Organisation), getOrganisations);
router
  .route("/:id")
  .get(getOrganisation)
  .put(updateOrganisation)
  .delete(authorize("admin"), deleteOrganisation);

module.exports = router;
