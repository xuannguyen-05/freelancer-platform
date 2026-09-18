const jwt = require("jsonwebtoken")
const User = require("../models/user")

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
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
        return res.status(401).json({
            message: "Invalid token"
        })
    }
}

module.exports = { authMiddleware }