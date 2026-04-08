const { z } = require("zod")
const { packageSchema } = require("./package.schema")
const { objectIdSchema } = require("../utils/objectIdSchema")

const imageSchema = z.union([
  z.string().url("Must be a valid URL"),
  z.string().regex(/^\/uploads\/.+$/, "Invalid upload path")
]);

const createGigSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  img_url: imageSchema.optional(),
  categoryID: objectIdSchema,
  packages: z.array(packageSchema).min(1).max(3)
}).strict()

const updateGigSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  img_url: imageSchema.optional(),
  categoryID: objectIdSchema.optional()
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
})

module.exports = { createGigSchema, updateGigSchema }