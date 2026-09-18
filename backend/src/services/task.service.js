const mongoose = require("mongoose")
const Project = require("../models/project")
const Task = require("../models/task")
const { TASK_STATUS } = require("../constants/taskStatus")
const { PROJECT_STATUS } = require("../constants/projectStatus")
const AppError = require("../utils/AppError")
const { CONTRACT_STATUS } = require("../constants/contractStatus")
const Contract = require("../models/contract")
const User = require("../models/user")


const isProjectParticipant = async (projectId, userId) => {
    const member = await Contract.exists({
        projectId,
        $or: [{ freelancerId: userId }, { memberIds: userId }]
    })

    return Boolean(member)
}

const assertProjectAccess = async (project, userId) => {
    if (String(project.buyerId) === String(userId)) {
        return
    }

    const isParticipant = await isProjectParticipant(project._id, userId)

    if (!isParticipant) {
        throw new AppError("You are not allowed to access this project", 403)
    }
}

const assertContractLead = (contract, userId) => {
    if (String(contract.freelancerId) !== String(userId)) {
        throw new AppError("Only contract lead can plan tasks", 403)
    }
}

const resolveAllowedAssigneeIds = async (contract) => {
    const ids = [String(contract.freelancerId), ...(contract.memberIds || []).map(String)]
    const uniqueIds = [...new Set(ids)]

    const freelancers = await User.find({ _id: { $in: uniqueIds }, role: "freelancer" })
        .select("_id")
        .lean()

    return new Set(freelancers.map(user => String(user._id)))
}

const toObjectId = (value, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new AppError(`Invalid ${fieldName}`, 400)
    }

    return new mongoose.Types.ObjectId(value)
}


const updateProjectStatusIfNeeded = async (project) => {
    const [openTasks, contracts] = await Promise.all([
        Task.countDocuments({
            projectId: project._id,
            status: { $in: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS] }
        }),
        Contract.find({ projectId: project._id }).select("status").lean()
    ])

    if (!contracts.length) {
        return
    }

    const allContractsClosed = contracts.every(
        c => c.status === CONTRACT_STATUS.COMPLETED || c.status === CONTRACT_STATUS.CANCELLED
    )

    if (allContractsClosed && openTasks === 0 && project.status !== PROJECT_STATUS.DELIVERED) {
        project.status = PROJECT_STATUS.DELIVERED
        await project.save()
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

    await assertProjectAccess(project, userId)

    const contractId = toObjectId(data.contractId, "Contract ID")

    const contract = await Contract.findOne({
        _id: contractId,
        projectId: project._id
    })

    if (!contract) {
        throw new AppError("Contract Not Found", 404)
    }

    assertContractLead(contract, userId)

    if (contract.status !== CONTRACT_STATUS.ACTIVE) {
        throw new AppError("Contract is not active yet", 400)
    }

        const allowedAssigneeIds = await resolveAllowedAssigneeIds(contract)

        if (data.assigneeId && !allowedAssigneeIds.has(String(data.assigneeId))) {
            throw new AppError("Assignee must belong to contract team", 400)
    }

    if (data.parentTaskId) {
        const parentTask = await Task.findOne({
            _id: data.parentTaskId,
            projectId: project._id,
            contractId: contract._id
        })

        if (!parentTask) {
            throw new AppError("Parent task not found in the same contract", 400)
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
        projectId: project._id,
        contractId: contract._id,
        parentTaskId: data.parentTaskId || null,
        assigneeId: data.assigneeId || String(contract.freelancerId),
        title: data.title,
        description: data.description ?? "",
        estimatedHours: data.estimatedHours || 0,
        effortPoint: data.effortPoint || 3,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
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

    await assertProjectAccess(project, userId)

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
        data: tasks,
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

    await assertProjectAccess(project, userId)

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

    await assertProjectAccess(project, userId)

    const contract = await Contract.findById(task.contractId)

    if (!contract) {
        throw new AppError("Contract Not Found", 404)
    }

    assertContractLead(contract, userId)

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

        const allowedAssigneeIds = await resolveAllowedAssigneeIds(contract)

        if (!allowedAssigneeIds.has(String(data.assigneeId))) {
            throw new AppError("Assignee must belong to contract team", 400)
        }

        updateData.assigneeId = data.assigneeId
    }

    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours
    if (data.effortPoint !== undefined) updateData.effortPoint = data.effortPoint
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null

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

    const contract = await Contract.findById(task.contractId)
    const isContractMember = contract && (
        String(contract.freelancerId) === String(userId) ||
        (contract.memberIds || []).some(id => String(id) === String(userId))
    )

    if (!isBuyer && !isContractMember) {
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
        updateData.completedAt = new Date()
    }

    if (status === TASK_STATUS.CANCELLED) {
        updateData.startedAt = null
        updateData.completedAt = null
    }

    const updated = await Task.findByIdAndUpdate(
        taskId,
        updateData,
        { new: true, runValidators: true }
    ).lean()

    await updateProjectStatusIfNeeded(project)

    return updated
}

const getTaskStatsByProjectService = async (projectId, userId) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId)

    if (!project) {
        throw new AppError("Project Not Found", 404)
    }

    await assertProjectAccess(project, userId)

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

                overdue: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ["$dueDate", null] },
                                    { $lt: ["$dueDate", new Date()] },
                                    { $in: ["$status", [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS]] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                totalEffort: { $sum: "$effortPoint" },

                doneEffort: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TASK_STATUS.DONE] }, "$effortPoint", 0]
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
        overdue: 0,
        totalEffort: 0,
        doneEffort: 0,
        totalEstimated: 0,
        totalActual: 0
    }
}

const getProjectProgressService = async (projectId, userId) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId)

    if (!project) {
        throw new AppError("Project Not Found", 404)
    }

    await assertProjectAccess(project, userId)

    const result = await Task.aggregate([
        {
            $match: {
                projectId: new mongoose.Types.ObjectId(projectId)
            }
        },
        {
            $group: {
                _id: null,

                totalEffort: { $sum: "$effortPoint" },

                doneEffort: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", TASK_STATUS.DONE] },
                            "$effortPoint",
                            0
                        ]
                    }
                }
            }
        }
    ])

    const totalEffort = result[0]?.totalEffort || 0
    const doneEffort = result[0]?.doneEffort || 0

    const progress = totalEffort === 0 ? 0 : (doneEffort / totalEffort) * 100

    return {
        progress,
        totalEffort,
        doneEffort
    }
}

const getFreelancerWorkloadService = async (freelancerId, requesterId, requesterRole) => {

    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
        throw new AppError("Invalid Freelancer ID", 400)
    }

    if (requesterRole !== "admin" && String(requesterId) !== String(freelancerId)) {
        throw new AppError("Forbidden", 403)
    }

    const freelancer = await User.findById(freelancerId).select("role").lean()
    if (!freelancer || freelancer.role !== "freelancer") {
        throw new AppError("Freelancer not found", 404)
    }

    const stats = await Task.aggregate([
        {
            $match: {
                assigneeId: new mongoose.Types.ObjectId(freelancerId),
                status: { $in: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE] }
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
                completedTasks: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TASK_STATUS.DONE] }, 1, 0]
                    }
                },

                overdueTasks: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ["$dueDate", null] },
                                    { $lt: ["$dueDate", new Date()] },
                                    { $in: ["$status", [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS]] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                totalEffort: { $sum: "$effortPoint" },
                totalEstimated: { $sum: "$estimatedHours" },
                totalActual: { $sum: "$actualHours" }
            }
        }
    ])

    return stats[0] || {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalEffort: 0,
        totalEstimated: 0,
        totalActual: 0
    }
}

const getOverdueOpenTasksService = async (userId, role, query = {}) => {
    if (!role) {
        throw new AppError("Unauthorized", 401)
    }

    const page = Math.max(Number(query.page) || 1, 1)
    const limit = Math.max(Number(query.limit) || 10, 1)
    const skip = (page - 1) * limit

    const match = {
        dueDate: { $ne: null, $lt: new Date() },
        status: { $in: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS] }
    }

    if (query.projectId) {
        if (!mongoose.Types.ObjectId.isValid(query.projectId)) {
            throw new AppError("Invalid Project ID", 400)
        }
        match.projectId = new mongoose.Types.ObjectId(query.projectId)
    }

    if (query.contractId) {
        if (!mongoose.Types.ObjectId.isValid(query.contractId)) {
            throw new AppError("Invalid Contract ID", 400)
        }
        match.contractId = new mongoose.Types.ObjectId(query.contractId)
    }

    if (query.assigneeId) {
        if (!mongoose.Types.ObjectId.isValid(query.assigneeId)) {
            throw new AppError("Invalid Assignee ID", 400)
        }
        match.assigneeId = new mongoose.Types.ObjectId(query.assigneeId)
    }

    if (role === "buyer") {
        const projects = await Project.find({ buyerId: userId }).select("_id").lean()
        const projectIds = projects.map(project => project._id)

        if (!projectIds.length) {
            return {
                data: [],
                pagination: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0
                }
            }
        }

        match.projectId = match.projectId
            ? { $in: projectIds.filter(id => String(id) === String(match.projectId)) }
            : { $in: projectIds }
    }

    if (role === "freelancer") {
        const contracts = await Contract.find({
            $or: [{ freelancerId: userId }, { memberIds: userId }]
        }).select("_id").lean()

        const contractIds = contracts.map(contract => contract._id)

        if (!contractIds.length) {
            return {
                data: [],
                pagination: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0
                }
            }
        }

        match.contractId = match.contractId
            ? { $in: contractIds.filter(id => String(id) === String(match.contractId)) }
            : { $in: contractIds }
    }

    const [tasks, total] = await Promise.all([
        Task.find(match)
            .sort({ dueDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Task.countDocuments(match)
    ])

    return {
        data: tasks,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
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
    getFreelancerWorkloadService,
    getOverdueOpenTasksService
}