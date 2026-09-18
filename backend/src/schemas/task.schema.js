const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),

    parentTaskId: objectIdSchema.optional(),
    assigneeId: objectIdSchema.optional(),

    estimatedHours: z.number().min(0).optional()
})

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    assigneeId: objectIdSchema.optional(),
    estimatedHours: z.number().min(0).optional()
})
.strict()
.refine(data =>
    Object.keys(data).length > 0,
{
    message: "At least one field must be provided"
})

const updateTaskStatusSchema = z.object({
    status: z.enum(["todo", "in_progress", "done", "cancelled"])
})


module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
}