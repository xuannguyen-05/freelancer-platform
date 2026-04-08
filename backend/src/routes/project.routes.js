const express = require("express");

const { authMiddleware } = require("../middlewares/auth.middleware.js");
const { roleMiddleware } = require("../middlewares/role.middleware.js");
const { validate } = require("../middlewares/validate.middleware");

const {
  createProject,
  getProjectById,
  getMyProjects,
  updateProject,
  completeProject,
  cancelProject,
} = require("../controllers/project.controller");

const {
  createTask,
  getTasksByProject,
} = require("../controllers/task.controller");

const {
  createProjectSchema,
  updateProjectSchema,
} = require("../schemas/project.schema.js");

const { createTaskSchema } = require("../schemas/task.schema");

const router = express.Router();

router.post("/", authMiddleware, validate(createProjectSchema), createProject);

router.get("/my", authMiddleware, getMyProjects);

router.get("/detail/:id", authMiddleware, getProjectById);

router.patch(
  "/:id",
  authMiddleware,
  validate(updateProjectSchema),
  updateProject,
);

// router.patch("/:id/accept", authMiddleware, acceptProject)

// router.patch("/:id/deliver", authMiddleware, deliverProject)


/**
 * @swagger
 * /api/projects/{id}/complete:
 *   patch:
 *     summary: Buyer marks project as completed
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch("/:id/complete", authMiddleware, completeProject);

/**
 * @swagger
 * /api/projects/{id}/cancel:
 *   patch:
 *     summary: Cancel project
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch("/:id/cancel", authMiddleware, cancelProject);

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   post:
 *     summary: Create task under a project
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               parentTaskId:
 *                 type: string
 *               assigneeId:
 *                 type: string
 *               estimatedHours:
 *                 type: number
 */
router.post(
  "/:projectId/tasks",
  authMiddleware,
  validate(createTaskSchema),
  createTask,
);


router.get("/:projectId/tasks", authMiddleware, getTasksByProject);

module.exports = router;
