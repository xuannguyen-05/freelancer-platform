const mongoose = require("mongoose")
const User = require("../models/user")
const AppError = require("../utils/AppError")

const getMeService = async(userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const me = await User.findById(userId).select("name email avatar bio role")

    if (!me) {
        throw new AppError("User not found", 404)
    }

    return me
}

const updateMeService = async(userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const allowedFields = ["name", "avatar", "bio"]
    const updateData = {}

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field]
        }
    }

    const existingUser = await User.findById(userId)

    if (!existingUser) {
        throw new AppError("User not found", 404)
    }
    
    const me = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    ).select("name email avatar bio role")

    return me
}

const getUserByIdService = async(id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid user ID", 400)
    }

    const user = await User.findById(id).select("name avatar bio role")

    if(!user){
        throw new AppError("User Not Found", 404)
    }

    return user
}


module.exports = {getMeService, updateMeService, getUserByIdService}