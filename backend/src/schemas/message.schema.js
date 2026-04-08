const { z } = require("zod")

const sendMessageSchema = z.object({
    content: z.string().trim().min(1, "Content is required")
}).strict()

module.exports = { sendMessageSchema }