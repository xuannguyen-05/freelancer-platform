const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")

const createFreelancerSchema = z.object({
  slogan: z.string().max(255, "Slogan too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  skills: z.array(objectIdSchema).optional()
}).strict()

const updateFreelancerSchema = createFreelancerSchema.partial()

module.exports = { createFreelancerSchema, updateFreelancerSchema }