const User = require("../models/user")

const roleMiddleware = (roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.userID
      if (!userId) {
        return res.status(401).json({
          code: "UNAUTHORIZED",
          message: "Unauthorized"
        })
      }

      const user = await User.findById(userId).select("role isActive")

      if (!user || !user.isActive) {
        return res.status(401).json({
          code: "UNAUTHORIZED",
          message: "Unauthorized"
        })
      }

      const hasRole = roles.includes(user.role)

      if (!hasRole) {
        return res.status(403).json({
          code: "FORBIDDEN",
          message: "Forbidden: insufficient permissions"
        })
      }

      next()
    } catch (error) {
      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "Internal server error"
      })
    }
  }
}

module.exports = { roleMiddleware }