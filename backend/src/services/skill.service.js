const mongoose = require("mongoose")
const Skill = require("../models/skill")
const Category = require("../models/category")
const AppError = require("../utils/AppError")

const createSkillService = async(skillName, categoryId) => {
    const normalizedName = String(skillName).trim().toLowerCase()

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new AppError("Invalid Category ID", 400)
    }

    const category = await Category.findById(categoryId)
    if (!category) {
        throw new AppError("Category Not Found", 404)
    }

    const existing = await Skill.findOne({ name: normalizedName })
    
    if(existing){
        throw new AppError("Skill already exists", 400);
        
    }
    
    const skill = await Skill.create({
        name: normalizedName,
        categoryId
    })

    return skill.toObject()
}

const getSkillsService = async() => {
    const skills = await Skill.find({}).sort({ name: 1 }).populate("categoryId", "name").lean()

    return skills
}

const getSkillByIdService = async(skillId) => {
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
        throw new AppError("Invalid Skill ID", 400)
    }

    const skill = await Skill.findById(skillId).populate("categoryId", "name").lean()

    if (!skill){
        throw new AppError("Skill Not Found", 404);
    }

    return skill
}

const updateSkillService = async(skillId, skillName, categoryId) => {
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
        throw new AppError("Invalid Skill ID", 400)
    }

    const skill = await Skill.findById(skillId)

    if (!skill){
        throw new AppError("Skill Not Found", 404);
    }

    //  check duplicate
    if (skillName) {
        const normalizedName = String(skillName).trim().toLowerCase()
        const existing = await Skill.findOne({ name: normalizedName })

        if (existing && String(existing._id) !== String(skillId)) {
            throw new AppError("Skill already exists", 400)
        }

        skill.name = normalizedName
    }

    if (categoryId !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new AppError("Invalid Category ID", 400)
        }

        const category = await Category.findById(categoryId)
        if (!category) {
            throw new AppError("Category Not Found", 404)
        }

        skill.categoryId = categoryId
    }

    await skill.save()

    return (await Skill.findById(skillId).populate("categoryId", "name").lean())
}

const deleteSkillService = async(skillId) => {
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
        throw new AppError("Invalid Skill ID", 400)
    }

    const skill = await Skill.findById(skillId)

    if (!skill){
        throw new AppError("Skill Not Found", 404);
    }

    await Skill.findByIdAndDelete(skillId)

    return skill.toObject()
}




module.exports = {createSkillService, getSkillsService, getSkillByIdService, updateSkillService, deleteSkillService}