const jwt = require("jsonwebtoken")
const User = require("../models/user")

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            code: "NO_TOKEN_PROVIDED",
            message: "No token provided"
        })
    }

    const token = authHeader.split(" ")[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const userId = decoded.userID || decoded.userId
        const user = await User.findById(userId).select("role isActive")

        if (!user || !user.isActive) {
            return res.status(401).json({
                code: "USER_INACTIVE",
                message: "User is inactive or no longer exists"
            })
        }

        req.user = {
            ...decoded,
            userID: String(user._id),
            role: user.role
        }
        next()
        
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                code: "TOKEN_EXPIRED",
                message: "Token has expired, please log in again"
            })
        }
        return res.status(401).json({
            code: "INVALID_TOKEN",
            message: "Invalid token"
        })
    }
}

module.exports = { authMiddleware }