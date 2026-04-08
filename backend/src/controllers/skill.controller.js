const {createSkillService, 
        getSkillsService, 
        getSkillByIdService, 
        updateSkillService, 
        deleteSkillService} = require("../services/skill.service")

const createSkill = async(req, res) => {
    try {
        const {skillName, categoryId} = req.body

        const skill = await createSkillService(skillName, categoryId)

        res.status(201).json({
            message: "Skill created successfully",
            data: skill
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getSkills = async(req, res) => {
    try {

        const skills = await getSkillsService()

        res.status(200).json({
            message: "Get skills successfully",
            data: skills
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getSkillById = async(req, res) => {
    try {
        const skillId = req.params.id

        const skill = await getSkillByIdService(skillId)

        res.status(200).json({
            message: "Get skill successfully",
            data: skill
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const updateSkill = async(req, res) => {
    try {

        const {skillName, categoryId} = req.body
        const skillId = req.params.id

        const skill = await updateSkillService(skillId, skillName, categoryId)

        res.status(200).json({
            message: "Update skill successfully",
            data: skill
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const deleteSkill = async(req, res) => {
    try {
        const skillId = req.params.id

        const skill = await deleteSkillService(skillId)

        res.status(200).json({
            message: "Delete skill successfully",
            data: null
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


module.exports = {createSkill, getSkills, getSkillById, updateSkill, deleteSkill}