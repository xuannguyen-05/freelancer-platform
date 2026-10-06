const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const User = require("../models/user")
const Gig = require("../models/gig")
const { deleteFromCloudinary } = require("./cloudinary.service")
const AppError = require("../utils/AppError")

const getMeService = async(userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400, "INVALID_USER_ID")
    }

    const me = await User.findById(userId)
        .select("name email avatar avatar_public_id bio role location professionalTitle skillNames skills freelancerProfile preferences createdAt")
        .populate({ path: "skills", select: "name" })

    if (!me) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND")
    }

    return me
}

const updateMeService = async(userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400, "INVALID_USER_ID")
    }

    const allowedFields = ["name", "avatar", "avatar_public_id", "bio", "location", "professionalTitle", "skillNames", "skills", "preferences"]
    const updateData = {}

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field]
        }
    }

    // Sync professionalTitle with freelancerProfile.slogan
    if (data.professionalTitle !== undefined) {
        updateData["freelancerProfile.slogan"] = data.professionalTitle
    }

    const existingUser = await User.findById(userId)

    if (!existingUser) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND")
    }
    
    // 1. Update MongoDB first
    const me = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    )
    .select("name email avatar avatar_public_id bio role location professionalTitle skillNames skills freelancerProfile preferences createdAt")
    .populate({ path: "skills", select: "name" })

    // 2. Only after MongoDB update succeeds, clean up old Cloudinary asset
    if (data.avatar !== undefined && data.avatar !== existingUser.avatar) {
        const oldAsset = existingUser.avatar_public_id || existingUser.avatar
        if (oldAsset && (existingUser.avatar_public_id || (typeof existingUser.avatar === "string" && existingUser.avatar.includes("cloudinary.com")))) {
            deleteFromCloudinary(oldAsset).catch((err) => {
                console.warn("[User Service] Failed to delete old Cloudinary avatar:", err.message)
            })
        }

        // Sync freelancer avatar in all gigs
        Gig.updateMany(
            { "freelancer._id": userId },
            { $set: { "freelancer.avatar": me.avatar || "" } }
        ).catch((err) => {
            console.warn("[User Service] Failed to sync freelancer avatar to gigs:", err.message)
        })
    }

    return me
}

const changePasswordService = async(userId, { currentPassword, newPassword }) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400, "INVALID_USER_ID")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND")
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
        throw new AppError("Incorrect current password", 400, "INVALID_CURRENT_PASSWORD")
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()

    return { success: true }
}

const getUserByIdService = async(id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid user ID", 400, "INVALID_USER_ID")
    }

    const user = await User.findById(id).select("name avatar bio role location")

    if(!user){
        throw new AppError("User Not Found", 404, "USER_NOT_FOUND")
    }

    return user
}

const lookupUserByEmailService = async (email) => {
    if (!email || typeof email !== "string" || !email.trim()) {
        throw new AppError("Email is required", 400, "EMAIL_REQUIRED")
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })
        .select("name email avatar bio role freelancerProfile professionalTitle createdAt")
        .lean()

    if (!user) {
        throw new AppError("User not found with this email", 404, "USER_NOT_FOUND")
    }

    return {
        _id: String(user._id),
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio || "",
        freelancerProfile: user.freelancerProfile || null,
        professionalTitle: user.professionalTitle || user.freelancerProfile?.slogan || ""
    }
}

module.exports = { 
    getMeService, 
    updateMeService, 
    changePasswordService, 
    getUserByIdService,
    lookupUserByEmailService 
}