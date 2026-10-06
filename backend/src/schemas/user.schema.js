const { z } = require("zod")

const avatarSchema = z.union([
  z.string().url("Avatar must be a valid URL"),
  z.string().regex(/^\/uploads\/.+$/, "Avatar path is invalid")
])

const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),

  avatar: avatarSchema.optional(),
  avatar_public_id: z.string().optional(),

  bio: z.string()
    .trim()
    .max(500, "Bio must be less than 500 characters")
    .optional(),

  location: z.string()
    .trim()
    .max(200, "Location must be less than 200 characters")
    .optional(),

  professionalTitle: z.string()
    .trim()
    .max(200, "Professional title must be less than 200 characters")
    .optional(),

  skills: z.array(z.string()).optional(),
  skillNames: z.array(z.string()).optional(),

  preferences: z.object({
    allowDirectContact: z.boolean().optional(),
    showPublicProfile: z.boolean().optional(),
    acceptOrders: z.boolean().optional()
  }).optional()
})
.strict()
.refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided"
  }
)

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters")
}).strict()

module.exports = { updateUserSchema, changePasswordSchema }