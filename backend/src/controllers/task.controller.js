const {
    createTaskService,
    getTasksByProjectService,
    getTaskByIdService,
    updateTaskService,
    updateTaskStatusService,
    getTaskStatsByProjectService,
    getProjectProgressService,
    getFreelancerWorkloadService
} = require("../services/task.service")
const {formatTaskSummary, formatTaskDetail} = require("../utils/formatTask")

const createTask = async(req, res) => {
    try {
        const userId = req.user.userID

        const projectId = req.params.projectId

        const task = await createTaskService(projectId, userId, req.body)

        res.status(201).json({
            message: "Task created successfully",
            data: formatTaskDetail(task)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getTasksByProject = async(req, res) => {
    try {
        const userId = req.user.userID

        const projectId = req.params.projectId

        const { page = 1, limit = 10 } = req.query

        const tasks = await getTasksByProjectService(projectId, userId, Number(page), Number(limit))

        res.status(200).json({
            message: "Get tasks successfully",
            data: tasks.map(formatTaskSummary)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getTaskById = async(req, res) => {
    try {
        const userId = req.user.userID

        const taskId = req.params.id

        const task = await getTaskByIdService(taskId, userId)

        res.status(200).json({
            message: "Get task detail successfully",
            data: formatTaskDetail(task)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const updateTask = async(req, res) => {
    try {
        const userId = req.user.userID

        const taskId = req.params.id

        const task = await updateTaskService(taskId, userId, req.body)

        res.status(200).json({
            message: "Update task successfully",
            data: formatTaskDetail(task)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const updateTaskStatus = async(req, res) => {
    try {
        const userId = req.user.userID

        const taskId = req.params.id

        const task = await updateTaskStatusService(taskId, userId, req.body)

        res.status(200).json({
            message: "Update task successfully",
            data: formatTaskDetail(task)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


const getTaskStatsByProject = async(req, res) => {
    try {

        const userId = req.user.userID

        const projectId = req.params.projectId

        const stats = await getTaskStatsByProjectService(projectId, userId)

        res.status(200).json({
            message: "Get task stats successfully",
            data: stats
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getProjectProgress = async(req, res) => {
    try {

        const userId = req.user.userID

        const projectId = req.params.projectId

        const progress = await getProjectProgressService(projectId, userId)

        res.status(200).json({
            message: "Get project progress successfully",
            data: progress
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getFreelancerWorkload = async(req, res) => {
    try {

        const freelancerId = req.params.id

        const workload = await getFreelancerWorkloadService(freelancerId)

        res.status(200).json({
            message: "Get freelancer workload successfully",
            data: workload
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


module.exports = {
    createTask,
    getTasksByProject,
    getTaskById,
    updateTask,
    updateTaskStatus,
    getTaskStatsByProject,
    getProjectProgress,
    getFreelancerWorkload
}