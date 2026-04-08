const { z } = require("zod")
const { objectIdSchema } = require("../utils/objectIdSchema")


const createOrderSchema = z.object({
  packageID: objectIdSchema
}).strict()

module.exports = { createOrderSchema }