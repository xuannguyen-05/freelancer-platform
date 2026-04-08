const mongoose = require("mongoose")
const User = require("../models/user")
const Skill = require("../models/skill")
const AppError = require("../utils/AppError")

const skillPopulate = {
    path: "skills",
    select: "name categoryId",
    populate: {
        path: "categoryId",
        select: "name"
    }
}

const normalizeAndValidateSkillIds = async(skills) => {
    if (!Array.isArray(skills)) return undefined

    const uniqueIds = [...new Set(skills.map((s) => String(s).trim()))].filter(Boolean)

    if (uniqueIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        throw new AppError("Invalid skill ID", 400)
    }

    const existingSkills = await Skill.find({ _id: { $in: uniqueIds } }).select("_id").lean()
    if (existingSkills.length !== uniqueIds.length) {
        throw new AppError("Some skills do not exist", 400)
    }

    return uniqueIds
}

const createFreelancerService = async(userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new AppError("User not found", 404)
    }

    if(user.role === "freelancer"){
        throw new AppError("Freelancer profile already exists", 409)
    }

    user.role = "freelancer"
    user.freelancerProfile = {
        ...user.freelancerProfile,
        slogan: data.slogan ?? "",
        description: data.description ?? "",
        level: user.freelancerProfile?.level ?? 1,
        rating: user.freelancerProfile?.rating ?? 0,
        reviewCount: user.freelancerProfile?.reviewCount ?? 0
    }

    const skillIds = await normalizeAndValidateSkillIds(data.skills)
    if (skillIds !== undefined) {
        user.skills = skillIds
    }

    await user.save()

    await user.populate(skillPopulate)

    return user
}

const getFreelancerByIdService = async(id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid freelancer ID", 400)
    }

    const freelancer = await User.findById(id)
        .select("name avatar role skills freelancerProfile")
        .populate(skillPopulate)
        .lean()

    if(!freelancer || freelancer.role !== "freelancer"){
        throw new AppError("Freelancer Not Found", 404)
    }

    return freelancer

}

const getMyFreelancerService = async(userId) => {

    const me = await User.findById(userId)
        .select("name avatar role skills freelancerProfile")
        .populate(skillPopulate)
        .lean()

    if(!me || me.role !== "freelancer"){
        throw new AppError("Freelancer Profile Not Found", 404);
        
    }
    
    return me
}

const updateMyFreelancerService = async(userId, data) => {

    const me = await User.findById(userId)

    if (!me || me.role !== "freelancer") {
        throw new AppError("Freelancer Profile Not Found", 404)
    }

    if (!me.freelancerProfile) {
        me.freelancerProfile = {}
    }

    if (data.slogan !== undefined) {
        me.freelancerProfile.slogan = data.slogan
    }
    if (data.description !== undefined) {
        me.freelancerProfile.description = data.description
    }

    const skillIds = await normalizeAndValidateSkillIds(data.skills)
    if(skillIds !== undefined){
        me.skills = skillIds
    }

    await me.save()

    await me.populate(skillPopulate)
    
    return me
}

module.exports = { createFreelancerService, getFreelancerByIdService, getMyFreelancerService, updateMyFreelancerService}

    