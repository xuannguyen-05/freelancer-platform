const express = require("express");

const { authMiddleware } = require("../middlewares/auth.middleware.js");
const { roleMiddleware } = require("../middlewares/role.middleware.js");
const { validate } = require("../middlewares/validate.middleware");

const {
  createContract,
  getContractById,
  getMyContracts,
  updateContract,
  updateContractStatus,
  payContract,
  getContractBalance,
  getContractStats,
  getFreelancerStats,
  getProjectSummary,
  getOverview,
} = require("../controllers/contract.controller");

const {
  createContractSchema,
  updateContractSchema,
  updateStatusSchema,
  paySchema,
} = require("../schemas/contract.schema.js");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["buyer"]),
  validate(createContractSchema),
  createContract,
);

router.get("/my", authMiddleware, getMyContracts);

/**
 * @swagger
 * /api/contracts/stats:
 *   get:
 *     summary: Get contract statistics for current user
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get contract stats successfully
 */
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware(["admin"]),
  getContractStats,
);

/**
 * @swagger
 * /api/contracts/overview:
 *   get:
 *     summary: Get contracts overview dashboard
 *     tags: [Statistics]
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get contracts overview successfully
 */
router.get("/overview", authMiddleware, roleMiddleware(["admin"]), getOverview);

/**
 * @swagger
 * /api/contracts/freelancer/{id}/stats:
 *   get:
 *     summary: Get freelancer contract statistics
 *     tags: [Statistics]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get freelancer contract stats successfully
 */
router.get(
  "/freelancer/:id/stats",
  authMiddleware,
  getFreelancerStats
);

/**
 * @swagger
 * /api/contracts/project/{projectId}/summary:
 *   get:
 *     summary: Get financial summary by project
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get project financial summary successfully
 */
router.get("/project/:projectId/summary", authMiddleware, getProjectSummary);

/**
 * @swagger
 * /api/contracts/{id}/status:
 *   patch:
 *     summary: Update contract status
 *     tags: [Contract]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, completed, cancelled]
 *     responses:
 *       200:
 *         description: Update contract status successfully
 */
router.patch(
  "/:id/status",
  authMiddleware,
  validate(updateStatusSchema),
  updateContractStatus,
);

/**
 * @swagger
 * /api/contracts/{id}/pay:
 *   post:
 *     summary: Pay contract amount
 *     tags: [Contract]
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pay contract successfully
 */
router.post(
  "/:id/pay",
  authMiddleware,
  roleMiddleware(["buyer"]),
  validate(paySchema),
  payContract,
);

/**
 * @swagger
 * /api/contracts/{id}/balance:
 *   get:
 *     summary: Get contract remaining balance
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get contract balance successfully
 */
router.get("/:id/balance", authMiddleware, getContractBalance);

router.get("/detail/:id", authMiddleware, getContractById);

router.patch(
  "/:id",
  authMiddleware,
  validate(updateContractSchema),
  updateContract,
);

module.exports = router;
