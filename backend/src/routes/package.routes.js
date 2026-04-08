const express = require("express");
const {validate} = require("../middlewares/validate.middleware")
const {updatePackageSchema} = require("../schemas/package.schema.js")
const { authMiddleware } = require("../middlewares/auth.middleware.js")
const {roleMiddleware} = require("../middlewares/role.middleware.js");
const { updatePackage, deletePackage } = require("../controllers/package.controller.js");
const router = express.Router();


router.patch("/:id", authMiddleware, roleMiddleware(["freelancer"]), validate(updatePackageSchema), updatePackage)
router.delete("/:id", authMiddleware, roleMiddleware(["freelancer"]), deletePackage)


module.exports = router

// PATCH /packages/:id
// DELETE /packages/:id