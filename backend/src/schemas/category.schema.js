const { z } = require("zod")

const createCategorySchema = z.object({
    categoryName: z
        .string()
        .min(2, "Category name must be at least 2 characters")
        .max(255),

    description: z
        .string()
        .max(1000)
        .optional()
})

const updateCategorySchema = z.object({
    categoryName: z.string().min(2).max(255).optional(),
    description: z.string().max(1000).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field is required"
})

module.exports = {
    createCategorySchema,
    updateCategorySchema
}