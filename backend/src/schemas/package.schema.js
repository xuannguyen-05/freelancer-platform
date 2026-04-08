const { z } = require("zod")

const packageSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  deliveryDay: z.coerce.number().int().min(1),
  revision: z.coerce.number().int().min(0).optional()
})

const createPackageSchema = packageSchema.strict()
const updatePackageSchema = packageSchema.partial().strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
})

module.exports = { packageSchema, createPackageSchema, updatePackageSchema }