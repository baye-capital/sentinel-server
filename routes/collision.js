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
const advancedResults = require("../middleware/advancedResults");

router.use(protect, lastActive);
router.post("/", upload, createCollision);

router.get("/", advancedResults(Collision), getCollisions);
router
  .route("/:id")
  .get(getCollision)
  .put(updateCollision)
  .delete(authorize("admin"), deleteCollision);

module.exports = router;
