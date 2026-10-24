const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")

const dueDateSchema = z.union([
    z.string().datetime(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be a valid date")
])

const createTaskSchema = z.object({
    contractId: objectIdSchema,
    title: z.string().min(1),
    description: z.string().optional(),

    parentTaskId: objectIdSchema.optional(),
    assigneeId: objectIdSchema.nullable().optional(),

    estimatedHours: z.number().min(0).optional(),
    effortPoint: z.number().int().min(1).max(13).optional(),
    dueDate: dueDateSchema.optional()
})

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    assigneeId: objectIdSchema.nullable().optional(),
    estimatedHours: z.number().min(0).optional(),
    effortPoint: z.number().int().min(1).max(13).optional(),
    dueDate: dueDateSchema.nullable().optional()
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