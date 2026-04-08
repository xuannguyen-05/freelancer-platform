const express = require("express");

const {
    createSkill,
    getSkills,
    getSkillById,
    updateSkill,
    deleteSkill
} = require("../controllers/skill.controller")
const { authMiddleware } = require("../middlewares/auth.middleware.js")
const { roleMiddleware } = require("../middlewares/role.middleware");
const {validate} = require("../middlewares/validate.middleware")
const {createSkillSchema, updateSkillSchema} = require("../schemas/skill.schema.js")


const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin"]), validate(createSkillSchema), createSkill)
router.get("/", getSkills)
router.get("/:id", getSkillById)
router.patch("/:id", authMiddleware, roleMiddleware(["admin"]), validate(updateSkillSchema), updateSkill)
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteSkill)




module.exports = router
