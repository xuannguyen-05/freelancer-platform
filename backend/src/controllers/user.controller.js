const { getMeService, updateMeService, changePasswordService, getUserByIdService, lookupUserByEmailService } = require("../services/user.service")
const formatUser = require("../utils/formatUser")

const getMe = async(req, res) => {
    try {
        const userId = req.user.userID
        const me = await getMeService(userId)

        res.status(200).json({
            message: "Get profile successfully",
            data: formatUser(me)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const updateMe = async(req, res) => {
    try {
        const userId = req.user.userID
        const me = await updateMeService(userId, req.body)

        res.status(200).json({
            message: "Update profile successfully",
            data: formatUser(me)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const changePassword = async(req, res) => {
    try {
        const userId = req.user.userID
        await changePasswordService(userId, req.body)

        res.status(200).json({
            message: "Password changed successfully"
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const getUserById = async(req, res) => {
    try {
        const id = req.params.id
        const user = await getUserByIdService(id)

        res.status(200).json({
            message: "Get user successfully",
            data: formatUser(user)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const lookupUserByEmail = async (req, res) => {
    try {
        const email = req.query.email
        const user = await lookupUserByEmailService(email)

        res.status(200).json({
            message: "User found successfully",
            data: user
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

module.exports = { getMe, updateMe, changePassword, getUserById, lookupUserByEmail }
