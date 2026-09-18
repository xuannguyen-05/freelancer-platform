const express = require("express");
const { register, login, refreshToken, logout, me  } = require("../controllers/auth.controller");
const {validate} = require("../middlewares/validate.middleware")
const {registerSchema, loginSchema} = require("../schemas/auth.schema.js")
const { authMiddleware } = require("../middlewares/auth.middleware.js")

const router = express.Router();

router.post("/register", validate(registerSchema), register)
router.post("/login", validate(loginSchema), login)
router.post("/refresh-token", refreshToken)
router.post("/logout", logout)
router.get("/me", authMiddleware, me)


module.exports = router
