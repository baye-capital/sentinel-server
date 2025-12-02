const express = require("express");
const {
  initializeTransaction,
  initializeTransactionInspection,
  getTransactions,
  webhook,
  initialiseKaduna,
  kadunaCallback,
} = require("../controllers/payments");

const router = express.Router({ mergeParams: true });

// Protect middleware
const {
  protect,
  authorize,
  validate,
  lastActive,
} = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.use(lastActive);

router.post("/", protect, initializeTransaction);
router.post("/kaduna", initialiseKaduna);
router.post("/callback", kadunaCallback);
router.post("/inspection", protect, initializeTransactionInspection);
router.post("/webhook", webhook);

router.get("/", protect, authorize("admin"), getTransactions);

module.exports = router;
