const mongoose = require("mongoose")
const Project = require("../models/project")
const User = require("../models/user")
const Task = require("../models/task")
const { TASK_STATUS } = require("../constants/taskStatus")
const { PROJECT_STATUS } = require("../constants/projectStatus")
const AppError = require("../utils/AppError")
const { CONTRACT_STATUS } = require("../constants/contractStatus")
const Contract = require("../models/contract")


const updateProjectStatusIfNeeded = async (project) => {
    const stats = await Task.aggregate([
        { $match: { projectId: project._id } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                done: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TASK_STATUS.DONE] }, 1, 0]
                    }
                },
                cancelled: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TASK_STATUS.CANCELLED] }, 1, 0]
                    }
                }
            }
        }
    ])

    const total = stats[0]?.total || 0
    const done = stats[0]?.done || 0
    const cancelled = stats[0]?.cancelled || 0

    //  rule: done + cancelled = total → project finished
    if (total > 0 && done + cancelled === total) {
        if (project.status !== PROJECT_STATUS.DELIVERED) {
            project.status = PROJECT_STATUS.DELIVERED
            await project.save()
        }
    }
}


const createTaskService = async(projectId, userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId)

    if(!project){
        throw new AppError("Project Not Found", 404)
    }

    const contract = await Contract.findById({ projectId: projectId })

    if (!contract) {
        throw new AppError("Contract Not Found", 404)
    }

    if (contract.status !== CONTRACT_STATUS.ACTIVE) {
        throw new AppError("Contract is not active yet", 400)
    }

    if (String(project.buyerId) !== String(userId)) {
        throw new AppError("Only buyer can create task", 403)
    }

    if (data.assigneeId) {
        if (String(data.assigneeId) !== String(project.freelancerId)) {
            throw new AppError("Invalid assignee", 400)
        }
    }

    const INVALID_TASK_PROJECT_STATUS = [   PROJECT_STATUS.DELIVERED,
                                            PROJECT_STATUS.COMPLETED,
                                            PROJECT_STATUS.CANCELLED
                                        ]

    if (INVALID_TASK_PROJECT_STATUS.includes(project.status)) {
        throw new AppError("Project is not in valid state for tasks", 400)
    }

     const task = await Task.create({
        projectId,
        assigneeId: data.assigneeId || null,
        title: data.title,
        description: data.description ?? "",
        estimatedHours: data.estimatedHours || 0,
        status: TASK_STATUS.TODO
    })

    return task
}

const getTasksByProjectService = async(projectId, userId, page, limit) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId)

    if(!project){
        throw new AppError("Project Not Found", 404)
    }

    const isBuyer = String(project.buyerId) === String(userId)
    const isFreelancer = String(project.freelancerId) === String(userId)

    if (!isBuyer && !isFreelancer) {
        throw new AppError("You are not allowed to access this tasks", 403)
    }

    const skip = (page - 1) * limit

    const [tasks, total] = await Promise.all([
        Task.find({ projectId })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean(),

        Task.countDocuments({ projectId })
    ])

    return {
        tasks,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}

const getTaskByIdService = async(taskId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new AppError("Invalid Task ID", 400)
    }

    const task = await Task.findById(taskId)

    if(!task){
        throw new AppError("Task Not Found", 404)
    }

    const project = await Project.findById(task.projectId)

    if (!project) {
        throw new AppError("Project Not Found", 404)
    }

    const isBuyer = String(project.buyerId) === String(userId)
    const isFreelancer = String(project.freelancerId) === String(userId)

    if (!isBuyer && !isFreelancer) {
        throw new AppError("You are not allowed to access this task", 403)
    }

    return task
}

const updateTaskService = async(taskId, userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new AppError("Invalid Task ID", 400)
    }

    const task = await Task.findById(taskId)

    if(!task){
        throw new AppError("Task Not Found", 404)
    }

    const project = await Project.findById(task.projectId)

    if (!project) {
        throw new AppError("Project Not Found", 404)
    }

    const isBuyer = String(project.buyerId) === String(userId)

    if (!isBuyer) {
        throw new AppError("Only the buyer can update this task", 403)
    }

    if (task.status !== TASK_STATUS.TODO) {
        throw new AppError("Cannot Update Task Now", 400)
    }

    const updateData = {}

    if (data.title !== undefined) updateData.title = data.title

    if (data.description !== undefined) updateData.description = data.description

    if (data.assigneeId !== undefined)  {
        if (task.status !== TASK_STATUS.TODO) {
            throw new AppError("Cannot change assignee after task started", 400)
        }

        if (String(data.assigneeId) !== String(project.freelancerId)) {
            throw new AppError("Invalid assignee", 400)
        }

        updateData.assigneeId = data.assigneeId
    }

    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours

    const updated = await Task.findByIdAndUpdate(
        taskId,
        updateData,
        {
            new: true,
            runValidators: true
        }
    ).lean()

    return updated
}

const updateTaskStatusService = async (taskId, userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new AppError("Invalid Task ID", 400)
    }

    const task = await Task.findById(taskId)
    if (!task) {
        throw new AppError("Task Not Found", 404)
    }

    const project = await Project.findById(task.projectId)
    if (!project) {
        throw new AppError("Project Not Found", 404)
    }

    const INVALID_PROJECT_STATUS = [
        PROJECT_STATUS.DELIVERED,
        PROJECT_STATUS.COMPLETED,
        PROJECT_STATUS.CANCELLED
    ]

    if (INVALID_PROJECT_STATUS.includes(project.status)) {
        throw new AppError("Project is not active", 400)
    }

    if (
        project.status === PROJECT_STATUS.PLANNING &&
        data.status === TASK_STATUS.IN_PROGRESS
    ) {
        throw new AppError("Project has not started yet", 400)
    }

    const isBuyer = String(project.buyerId) === String(userId)
    const isFreelancer = String(project.freelancerId) === String(userId)

    if (!isBuyer && !isFreelancer) {
        throw new AppError("You are not allowed", 403)
    }

    const { status } = data

    if ([TASK_STATUS.DONE, TASK_STATUS.CANCELLED].includes(task.status)) {
        throw new AppError("Task is already finished", 400)
    }

    const validTransitions = {
        [TASK_STATUS.TODO]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.CANCELLED],
        [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED]
    }

    if (!validTransitions[task.status]?.includes(status)) {
        throw new AppError("Invalid status transition", 400)
    }

    if (status === TASK_STATUS.IN_PROGRESS || status === TASK_STATUS.DONE) {
        if (!task.assigneeId ||String(task.assigneeId) !== String(userId)) {
            throw new AppError("Only assignee can do this", 403)
        }
    }

    let updateData = { status }

    if (status === TASK_STATUS.IN_PROGRESS) {
        updateData.startedAt = new Date()
    }

    if (status === TASK_STATUS.DONE) {
        if (!task.startedAt) {
            throw new AppError("Task has not been started", 400)
        }

        const durationMs = new Date() - task.startedAt
        const actualHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100

        updateData.actualHours = actualHours
    }

    if (status === TASK_STATUS.CANCELLED) {
        updateData.startedAt = null
    }

    const updated = await Task.findByIdAndUpdate(
        taskId,
        updateData,
        { new: true, runValidators: true }
    ).lean()

    await updateProjectStatusIfNeeded(project)

    return updated
}

const getTaskStatsByProjectService = async (projectId) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const stats = await Task.aggregate([
        {
            $match: {
                projectId: new mongoose.Types.ObjectId(projectId)
            }
        },
        {
            $group: {
                _id: null,

                totalTasks: { $sum: 1 },

                todo: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TASK_STATUS.TODO] }, 1, 0]
                    }
                },

                inProgress: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TASK_STATUS.IN_PROGRESS] }, 1, 0]
                    }
                },

                done: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TASK_STATUS.DONE] }, 1, 0]
                    }
                },

                totalEstimated: { $sum: "$estimatedHours" },

                totalActual: { $sum: "$actualHours" }
            }
        }
    ])

    return stats[0] || {
        totalTasks: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        totalEstimated: 0,
        totalActual: 0
    }
}

const getProjectProgressService = async (projectId) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const result = await Task.aggregate([
        {
            $match: {
                projectId: new mongoose.Types.ObjectId(projectId)
            }
        },
        {
            $group: {
                _id: null,

                total: { $sum: 1 },

                done: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", TASK_STATUS.DONE] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ])

    const total = result[0]?.total || 0
    const done = result[0]?.done || 0

    const progress = total === 0 ? 0 : (done / total) * 100

    return {
        progress,
        total,
        done
    }
}

const getFreelancerWorkloadService = async (freelancerId) => {

    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
        throw new AppError("Invalid Freelancer ID", 400)
    }

    const stats = await Task.aggregate([
        {
            $match: {
                assigneeId: new mongoose.Types.ObjectId(freelancerId)
            }
        },
        {
            $group: {
                _id: null,

                totalTasks: { $sum: 1 },

                activeTasks: {
                    $sum: {
                        $cond: [
                            { $in: ["$status", [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS]] },
                            1,
                            0
                        ]
                    }
                },

                totalEstimated: { $sum: "$estimatedHours" },
                totalActual: { $sum: "$actualHours" }
            }
        }
    ])

    return stats[0] || {
        totalTasks: 0,
        activeTasks: 0,
        totalEstimated: 0,
        totalActual: 0
    }
}


module.exports = {
    createTaskService,
    getTasksByProjectService,
    getTaskByIdService,
    updateTaskService,
    updateTaskStatusService,
    getTaskStatsByProjectService,
    getProjectProgressService,
    getFreelancerWorkloadService
}