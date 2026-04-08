const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")

const createProjectSchema = z.object({
    orderId: objectIdSchema,
    description: z.string().max(1000).optional()
}).strict()

const updateProjectSchema = z.object({
    description: z.string().max(1000).optional()
})
.strict()
// .refine(data => data.description, {
//     message: "At least one field must be provided"
// })
.refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
})

module.exports = {createProjectSchema, updateProjectSchema}