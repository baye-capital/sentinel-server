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
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  deleteInspection,
  getInspectionsMonth,
  getInspectionStats,
  getInspectionStatsPie,
  getInspectionByDay,
} = require("../controllers/inspection");

const Inspection = require("../models/Inspection");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize, lastActive } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.use(protect, lastActive);

router.post("/", upload, createInspection);
router.get("/stat", getInspectionStats);
router.get("/stat/pie", getInspectionStatsPie);
router.get("/day", getInspectionByDay);
router.get("/", advancedResults(Inspection), getInspections);
router
  .route("/:id")
  .get(getInspection)
  .put(upload, updateInspection)
  .delete(authorize("admin"), deleteInspection);

module.exports = router;
