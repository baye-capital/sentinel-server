const express = require("express");
const multer = require("multer");
const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024 },
  array: true,
}).fields([
  {
    name: "docs",
    maxCount: 4,
  },
]);
const {
  getInsurances,
  getInsurance,
  createInsurance,
  updateInsurance,
  deleteInsurance,
  getInsurancesGraph,
  getInsuranceStats,
  getInsuranceStatsBar,
  getInsuranceStatsPie,
} = require("../controllers/insurance");

const Insurance = require("../models/Insurance");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.post("/", upload, createInsurance);

router.use(protect, lastActive);
router.get("/stat", getInsuranceStats);
router.get("/stat/bar", getInsuranceStatsBar);
router.get("/stat/pie", getInsuranceStatsPie);
router.get("/graph", getInsurancesGraph);
router.get("/", advancedResults(Insurance), getInsurances);
router
  .route("/:id")
  .get(getInsurance)
  .put(upload, updateInsurance)
  .delete(authorize("admin"), deleteInsurance);

module.exports = router;
