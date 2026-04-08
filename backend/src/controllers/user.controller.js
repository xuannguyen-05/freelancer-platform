const {getMeService, updateMeService, getUserByIdService} = require("../services/user.service")
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
            message: error.message
        })
    }
}

module.exports = {getMe, updateMe, getUserById}
