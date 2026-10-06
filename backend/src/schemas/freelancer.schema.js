const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")

const createFreelancerSchema = z.object({
  slogan: z.string({ required_error: "Slogan is required" })
    .trim()
    .min(5, "Slogan must be at least 5 characters")
    .max(255, "Slogan too long"),
  description: z.string().trim().max(1000, "Description too long").optional(),
  skills: z.array(objectIdSchema)
    .min(1, "Please select at least 1 skill")
}).strict()

const updateFreelancerSchema = createFreelancerSchema.partial()

module.exports = { createFreelancerSchema, updateFreelancerSchema }