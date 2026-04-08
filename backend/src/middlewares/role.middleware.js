const User = require("../models/user")

const roleMiddleware = (roles) => {
  return async (req, res, next) => {
    try {
      const tokenRole = req.user?.role
      if (tokenRole && roles.includes(tokenRole)) {
        return next()
      }

      const userId = req.user?.userId || req.user?.userID
      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized"
        })
      }

      const user = await User.findById(userId).select("role")

      if (!user) {
        return res.status(401).json({
          message: "Unauthorized"
        })
      }

      const hasRole = roles.includes(user.role)

      if (!hasRole) {
        return res.status(403).json({
          message: "Forbidden"
        })
      }

      next()
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error"
      })
    }
  }
}

module.exports = { roleMiddleware }