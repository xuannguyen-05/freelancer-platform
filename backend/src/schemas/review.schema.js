const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")

const createReviewSchema = z.object({
    orderId: objectIdSchema,
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional()
}).strict()

module.exports = { createReviewSchema }