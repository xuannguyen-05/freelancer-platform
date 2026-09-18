const {
    registerService,
    loginService,
    refreshTokenService,
    logoutService
} = require("../services/auth.service")
const User = require("../models/user")

const register  = async(req, res) => {
    try {
        const user = await registerService(req.body)
        res.status(201).json({
            message: "Register success", 
            data: user
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const login = async(req, res) => {
    try {
        const user = await loginService(req.body)
        res.status(200).json({
            message: "Login success", 
            data: user
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const refreshToken = async(req, res) => {
    try {
        const data = await refreshTokenService(req.body.refreshToken)
        res.status(200).json({ data })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const logout = async(req, res) => {
    try {
        const data = await logoutService(req.body.refreshToken)
        res.status(200).json(data)
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const me = async (req, res) => {
    try {
        const user = await User.findById(req.user.userID)
            .select("name email avatar bio role isActive freelancerProfile skills")
            .lean()

        if (!user || !user.isActive) {
            return res.status(401).json({ message: "User is inactive or no longer exists" })
        }

        res.json({ user })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}

module.exports = {register, login, refreshToken, logout, me}