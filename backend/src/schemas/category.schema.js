const { z } = require("zod")

const createCategorySchema = z.object({
    categoryName: z.string().min(2, "Category name must be at least 2 characters").max(255).optional(),
    name: z.string().min(2, "Category name must be at least 2 characters").max(255).optional(),
    description: z.string().max(1000).optional()
}).refine(data => Boolean(data.categoryName || data.name), {
    message: "Category name must be at least 2 characters",
    path: ["categoryName"]
}).transform(data => ({
    categoryName: (data.categoryName || data.name).trim(),
    description: data.description || ""
}))

const updateCategorySchema = z.object({
    categoryName: z.string().min(2).max(255).optional(),
    name: z.string().min(2).max(255).optional(),
    description: z.string().max(1000).optional()
}).refine(data => Boolean(data.categoryName || data.name || data.description !== undefined), {
    message: "At least one field is required"
}).transform(data => {
    const res = {}
    if (data.categoryName || data.name) {
        res.categoryName = (data.categoryName || data.name).trim()
    }
    if (data.description !== undefined) {
        res.description = data.description
    }
    return res
})

module.exports = {
    createCategorySchema,
    updateCategorySchema
}