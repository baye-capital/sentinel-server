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
const advancedResults = require("../middleware/advancedResults");

router.use(protect, lastActive);

router.post("/", authorize("state admin", "zonal head"), upload, createUser);
router.get(
  "/",
  // authorize("state admin", "zonal head", "observer"),
  advancedResults(User),
  getUsers
);

router.post("/invite", sendInvite);
router.post("/invite/:resettoken", acceptInvite);
router.get("/invite/:resettoken", viewInvite);
router.get("/:id/stats", getUserStats);
router.get("/stats", getAllStats);

router
  .route("/:id")
  .get(getUser)
  .put(updateUser)
  .delete(authorize("state admin", "zonal head"), deleteUser);

module.exports = router;
