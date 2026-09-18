const {createProjectService, 
    getProjectByIdService, 
    getMyProjectsService,
    updateProjectService,
    completeProjectService,
    cancelProjectService
} = require("../services/project.service")
const {formatProjectSummary, formatProjectDetail} = require("../utils/formatProject")

const createProject = async(req, res) => {
    try {
        const userId = req.user.userID

        const {orderId, description} = req.body

        const project = await createProjectService(orderId, userId, description)

        res.status(201).json({
            message: "Project created successfully",
            data: formatProjectDetail(project)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getProjectById = async(req, res) => {
    try {

        const userId = req.user.userID

        const projectId = req.params.id

        const project = await getProjectByIdService(projectId, userId)

        res.status(200).json({
            message: "Get project detail successfully",
            data: formatProjectDetail(project)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getMyProjects = async(req, res) => {
    try {

        const userId = req.user.userID

        const role = req.user.role

        const { page = 1, limit = 10 } = req.query

        const projects = await getMyProjectsService(userId, role, Number(page), Number(limit))

        res.status(200).json({
            message: "Get my projects successfully",
            data: projects.projects.map(formatProjectSummary),
            pagination: projects.pagination
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const updateProject = async(req, res) => {
    try {

        const userId = req.user.userID

        const projectId = req.params.id

        const project = await updateProjectService(projectId, userId, req.body)

        res.status(200).json({
            message: "Update project successfully",
            data: formatProjectDetail(project)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


const completeProject = async(req, res) => {
    try {

        const userId = req.user.userID

        const projectId = req.params.id

        const project = await completeProjectService(projectId, userId)

        res.status(200).json({
            message: "Update project successfully",
            data: formatProjectDetail(project)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const cancelProject = async(req, res) => {
    try {

        const userId = req.user.userID

        const projectId = req.params.id

        const project = await cancelProjectService(projectId, userId)

        res.status(200).json({
            message: "Update project successfully",
            data: formatProjectDetail(project)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}



module.exports = {createProject,
                    getProjectById,
                    getMyProjects,
                    updateProject,
                    completeProject,
                    cancelProject
                }