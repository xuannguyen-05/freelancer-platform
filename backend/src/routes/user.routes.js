const express = require("express");
const { getMe, updateMe, changePassword, getUserById, lookupUserByEmail } = require("../controllers/user.controller")
const { authMiddleware } = require("../middlewares/auth.middleware.js")
const { updateUserSchema, changePasswordSchema } = require("../schemas/user.schema.js")
const { validate } = require("../middlewares/validate.middleware")
const normalizeUploadField = require("../middlewares/normalizeUploadField.middleware.js")
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/me", authMiddleware, getMe)
router.patch("/me", authMiddleware, upload.single("avatar"), normalizeUploadField("avatar", "workly/avatars"), validate(updateUserSchema), updateMe)
router.post("/change-password", authMiddleware, validate(changePasswordSchema), changePassword)

router.get("/lookup", authMiddleware, lookupUserByEmail)
router.get("/:id", getUserById)

module.exports = router
