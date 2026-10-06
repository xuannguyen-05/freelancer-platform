const express = require("express");
const adminController = require("../controllers/admin.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { roleMiddleware } = require("../middlewares/role.middleware");

const router = express.Router();

// Enforce admin-only access
router.use(authMiddleware, roleMiddleware(["admin"]));

// Dashboard & Analytics
router.get("/overview", adminController.getOverview);
router.get("/analytics", adminController.getAnalytics);

// Freelancer Applications
router.get("/applications", adminController.getApplications);
router.get("/applications/:id", adminController.getApplicationById);
router.post("/applications/:id/approve", adminController.approveApplication);
router.post("/applications/:id/reject", adminController.rejectApplication);

module.exports = router;
