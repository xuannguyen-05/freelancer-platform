const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")

const createSkillSchema = z.object({
    skillName: z.string().min(2, "Skill name must be at least 2 characters").max(255, "Skill name too long").optional(),
    name: z.string().min(2, "Skill name must be at least 2 characters").max(255, "Skill name too long").optional(),
    categoryId: objectIdSchema
}).refine(data => Boolean(data.skillName || data.name), {
    message: "Skill name must be at least 2 characters",
    path: ["skillName"]
}).transform(data => ({
    skillName: (data.skillName || data.name).trim(),
    categoryId: data.categoryId
}))

const updateSkillSchema = z.object({
    skillName: z.string().min(2).max(255).optional(),
    name: z.string().min(2).max(255).optional(),
    categoryId: objectIdSchema.optional()
}).refine(data => Boolean(data.skillName || data.name || data.categoryId), {
    message: "At least one field is required"
}).transform(data => {
    const res = {}
    if (data.skillName || data.name) {
        res.skillName = (data.skillName || data.name).trim()
    }
    if (data.categoryId) {
        res.categoryId = data.categoryId
    }
    return res
})

module.exports = {
    createSkillSchema,
    updateSkillSchema
}