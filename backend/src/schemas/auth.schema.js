const { z } = require("zod")

const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().toLowerCase().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters")
})

const loginSchema = z.object({
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters")
})


module.exports = {registerSchema, loginSchema}

// test hết các trg hợp validation, lỗi 