const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")

const createSkillSchema = z.object({
    skillName: z
        .string()
        .min(2, "Skill name must be at least 2 characters")
        .max(255, "Skill name too long"),
    categoryId: objectIdSchema
})

const updateSkillSchema = z.object({
    skillName: z.string().min(2).max(255).optional(),
    categoryId: objectIdSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field is required"
})

module.exports = {
    createSkillSchema,
    updateSkillSchema
}