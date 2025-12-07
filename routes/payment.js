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

/**
 * @swagger
 * /api/v1/payment:
 *   post:
 *     summary: Initialize insurance payment transaction
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *               policy:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment transaction initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorization_url:
 *                       type: string
 *                     access_code:
 *                       type: string
 *                     reference:
 *                       type: string
 *   get:
 *     summary: Get all payment transactions (Admin only)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of transactions
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/", protect, initializeTransaction);

/**
 * @swagger
 * /api/v1/payment/kaduna:
 *   post:
 *     summary: Initialize PayKaduna payment
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: PayKaduna payment initialized
 */
router.post("/kaduna", initialiseKaduna);

/**
 * @swagger
 * /api/v1/payment/callback:
 *   post:
 *     summary: PayKaduna payment callback
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post("/callback", kadunaCallback);

/**
 * @swagger
 * /api/v1/payment/inspection:
 *   post:
 *     summary: Initialize inspection payment transaction
 *     tags: [Payments]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: object
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment transaction initialized
 */
router.post("/inspection", protect, initializeTransactionInspection);

/**
 * @swagger
 * /api/v1/payment/webhook:
 *   post:
 *     summary: Paystack payment webhook
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post("/webhook", webhook);

router.get("/", protect, authorize("admin"), getTransactions);

module.exports = router;
