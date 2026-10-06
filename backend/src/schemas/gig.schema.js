const { z } = require("zod")
const { packageSchema } = require("./package.schema")
const { objectIdSchema } = require("../utils/objectIdSchema")

const imageSchema = z.union([
  z.string().url("Must be a valid URL"),
  z.string().regex(/^\/uploads\/.+$/, "Invalid upload path")
]);

const tagsSchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return []
  if (Array.isArray(val)) return val.map((t) => String(t).trim()).filter(Boolean)
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean)
    } catch (_) {}
    return val.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}, z.array(z.string().trim().min(1))).optional();

const createGigSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  img_url: imageSchema.optional(),
  image: imageSchema.optional(),
  img_public_id: z.string().optional(),
  categoryID: objectIdSchema,
  tags: tagsSchema,
  packages: z.array(packageSchema).min(1).max(3)
}).transform(data => {
  if (data.image && !data.img_url) {
    data.img_url = data.image
  }
  delete data.image
  return data
})

const updateGigSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  img_url: imageSchema.optional(),
  image: imageSchema.optional(),
  img_public_id: z.string().optional(),
  categoryID: objectIdSchema.optional(),
  tags: tagsSchema
}).transform(data => {
  if (data.image && !data.img_url) {
    data.img_url = data.image
  }
  delete data.image
  return data
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided"
})

module.exports = { createGigSchema, updateGigSchema }