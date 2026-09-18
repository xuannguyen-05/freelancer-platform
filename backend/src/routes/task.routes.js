const express = require("express");

const { authMiddleware } = require("../middlewares/auth.middleware");
const { roleMiddleware } = require("../middlewares/role.middleware");
const { validate } = require("../middlewares/validate.middleware");

const {
  getTaskById,
  updateTask,
  updateTaskStatus,
  getTaskStatsByProject,
  getProjectProgress,
  getFreelancerWorkload,
  getOverdueOpenTasks
} = require("../controllers/task.controller");

const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} = require("../schemas/task.schema");


const router = express.Router();

/**
 * @swagger
 * /api/tasks/project/{projectId}/stats:
 *   get:
 *     summary: Get task statistics of a project
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get project task stats successfully
 */
router.get("/project/:projectId/stats", authMiddleware, getTaskStatsByProject)

/**
 * @swagger
 * /api/tasks/project/{projectId}/progress:
 *   get:
 *     summary: Get overall progress of a project
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get project progress successfully
 */
router.get("/project/:projectId/progress", authMiddleware, getProjectProgress)

/**
 * @swagger
 * /api/tasks/freelancer/{id}/workload:
 *   get:
 *     summary: Get freelancer workload statistics
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get freelancer workload successfully
 */
router.get("/freelancer/:id/workload", authMiddleware, roleMiddleware(["admin", "freelancer"]), getFreelancerWorkload)

/**
 * @swagger
 * /api/tasks/overdue-open:
 *   get:
 *     summary: Query overdue tasks that are not finished
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: contractId
 *         schema:
 *           type: string
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Get overdue open tasks successfully
 */
router.get("/overdue-open", authMiddleware, getOverdueOpenTasks)


router.get("/:id", authMiddleware, getTaskById);
router.patch(
  "/:id",
  authMiddleware,
  validate(updateTaskSchema),
  updateTask,
);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     tags: [Task]
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
 *                 enum: [todo, in_progress, done, cancelled]
 *     responses:
 *       200:
 *         description: Update task status successfully
 */
router.patch(
  "/:id/status",
  authMiddleware,
  validate(updateTaskStatusSchema),
  updateTaskStatus,
);



module.exports = router;
