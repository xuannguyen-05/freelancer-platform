const mongoose = require("mongoose")
const Project = require("../models/project")
const Contract = require("../models/contract")
const User = require("../models/user")
const Task = require("../models/task")
const Order = require("../models/order")
const { PROJECT_STATUS } = require("../constants/projectStatus")
const { CONTRACT_STATUS } = require("../constants/contractStatus")
const { TASK_STATUS } = require("../constants/taskStatus")
const AppError = require("../utils/AppError")

const normalizeMemberIds = (memberIds = [], freelancerId) => {
    const normalized = [...new Set(memberIds.map(String))]
    return normalized.filter(id => id !== String(freelancerId))
}

const validateMemberIds = async (memberIds = []) => {
    if (!memberIds.length) {
        return
    }

    const invalidIds = memberIds.filter(id => !mongoose.Types.ObjectId.isValid(id))

    if (invalidIds.length) {
        throw new AppError("Invalid member IDs", 400)
    }

    const members = await User.find({ _id: { $in: memberIds } }).select("role").lean()

    if (members.length !== memberIds.length) {
        throw new AppError("Some team members were not found", 404)
    }

    const hasNonFreelancer = members.some(member => member.role !== "freelancer")

    if (hasNonFreelancer) {
        throw new AppError("All team members must be freelancers", 400)
    }
}

const getContractBudget = (contract) => {
    if (contract.type === "hourly") {
        const hours = contract.hours || 0
        return Number((contract.price * hours).toFixed(2))
    }

    return Number(contract.price.toFixed(2))
}

const getHourlyPayableByWorklog = async (contract) => {
    const taskStats = await Task.aggregate([
        {
            $match: {
                contractId: contract._id,
                status: TASK_STATUS.DONE
            }
        },
        {
            $group: {
                _id: null,
                workedHours: { $sum: "$actualHours" }
            }
        }
    ])

    const workedHours = taskStats[0]?.workedHours || 0
    const byWorklog = Number((workedHours * contract.price).toFixed(2))

    return Math.min(byWorklog, getContractBudget(contract))
}


const createContractService = async(projectId, userId, data) => {

    const project = await Project.findById(projectId)

    if(!project){
        throw new AppError("Project Not Found", 404)
    }

    const isBuyer = String(project.buyerId) === String(userId)
    
    if (!isBuyer) {
        throw new AppError("Only buyer can create contract", 403)
    }

    if (String(data.freelancerId) === String(userId)) {
        throw new AppError("Cannot assign yourself", 400)
    }

    if (project.status !== PROJECT_STATUS.PLANNING) {
        throw new AppError("Cannot create contract for this project", 400)
    }
   
    const freelancer = await User.findById(data.freelancerId)
    if (!freelancer) {
        throw new AppError("Freelancer not found", 404)
    }

    if (freelancer.role !== "freelancer") {
        throw new AppError("Primary freelancer must have freelancer role", 400)
    }

    const memberIds = normalizeMemberIds(data.memberIds, data.freelancerId)
    await validateMemberIds(memberIds)

    if (memberIds.includes(String(project.buyerId))) {
        throw new AppError("Buyer cannot be contract member", 400)
    }

    const existed = await Contract.findOne({
        projectId,
        freelancerId: data.freelancerId,
        status: { $in: [CONTRACT_STATUS.DRAFT, CONTRACT_STATUS.ACTIVE] }
    })

    if (existed) {
        throw new AppError("Contract already exists", 400)
    }

    const contract = await Contract.create({
        projectId,
        buyerId: project.buyerId,
        freelancerId: data.freelancerId,
        type: data.type,
        price: data.price,
        hours: data.type === "hourly" ? data.hours : null,
        memberIds,
        paidAmount: 0,
        status: CONTRACT_STATUS.DRAFT,
        startDate: null,
        endDate: null
    })

    return contract
}

const getContractByIdService = async(contractId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }
    
    const contract = await Contract.findById(contractId)

    if(!contract){
        throw new AppError("Contract Not Found", 404)
    }

    const isBuyer = String(contract.buyerId) === String(userId)
    const isFreelancer =
        String(contract.freelancerId) === String(userId) ||
        (contract.memberIds || []).some(id => String(id) === String(userId))

    if (!isBuyer && !isFreelancer) {
        throw new AppError("You are not allowed to access this contract", 403)
    }

    return contract
}

const getMyContractsService = async(userId) => {
    
    const contracts = await Contract.find({
        $or: [
            { buyerId: userId },
            { freelancerId: userId },
            { memberIds: userId }
        ]
    })

    return contracts
}

const updateContractService = async (contractId, userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }

    const contract = await Contract.findById(contractId)

    if (!contract) {
        throw new AppError("Contract not found", 404)
    }

    if (String(contract.buyerId) !== String(userId)) {
        throw new AppError("Only buyer can update", 403)
    }

    if (contract.status !== CONTRACT_STATUS.DRAFT) {
        throw new AppError("Cannot update contract now", 400)
    }

    const updateData = {}

    // update price
    if (data.price !== undefined) {
        updateData.price = data.price
    }

    // xử lý type + hours
    if (data.type !== undefined) {
        updateData.type = data.type

        if (data.type === "fixed") {
        updateData.hours = null
        }

        if (data.type === "hourly") {
            if (data.hours === undefined) {
                throw new AppError("Hours required for hourly contract", 400)
            }
            updateData.hours = data.hours
        }
    } else {
        // không đổi type nhưng update hours
        if (data.hours !== undefined) {
            if (contract.type !== "hourly") {
                throw new AppError("Cannot set hours for fixed contract", 400)
            }
            updateData.hours = data.hours
        }
    }

    if (data.memberIds !== undefined) {
        const normalizedMembers = normalizeMemberIds(data.memberIds, contract.freelancerId)
        await validateMemberIds(normalizedMembers)

        if (normalizedMembers.includes(String(contract.buyerId))) {
            throw new AppError("Buyer cannot be contract member", 400)
        }

        updateData.memberIds = normalizedMembers
    }

    const updated = await Contract.findByIdAndUpdate(
        contractId,
        { $set: updateData },
        { new: true, runValidators: true }
    )

    return updated
}

const updateContractStatusService = async (contractId, userId, status) => {

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }

    const contract = await Contract.findById(contractId)

    if (!contract) {
        throw new AppError("Contract not found", 404)
    }

    const isBuyer = String(contract.buyerId) === String(userId)
    const isFreelancer = String(contract.freelancerId) === String(userId)
    const isMember = (contract.memberIds || []).some(id => String(id) === String(userId))

    if (!isBuyer && !isFreelancer && !isMember) {
        throw new AppError("Forbidden", 403)
    }

    if (status === CONTRACT_STATUS.ACTIVE) {
        if (!isFreelancer) {
            throw new AppError("Only freelancer can activate contract", 403)
        }

        if (contract.status !== CONTRACT_STATUS.DRAFT) {
            throw new AppError("Invalid status transition", 400)
        }

        contract.startDate = new Date()
        
        await Project.findByIdAndUpdate(contract.projectId, {
            status: PROJECT_STATUS.IN_PROGRESS
        })
    }

    if (status === CONTRACT_STATUS.COMPLETED) {
        if (!isBuyer) {
            throw new AppError("Only buyer can complete contract", 403)
        }

        if (contract.status !== CONTRACT_STATUS.ACTIVE) {
            throw new AppError("Invalid status transition", 400)
        }
    }

    if (status === CONTRACT_STATUS.CANCELLED) {
        if (!isBuyer && !isFreelancer) {
            throw new AppError("Forbidden", 403)
        }

        if (contract.status === CONTRACT_STATUS.COMPLETED) {
            throw new AppError("Cannot cancel completed contract", 400)
        }
    }

    contract.status = status

    if (status === CONTRACT_STATUS.ACTIVE) {
        contract.startDate = new Date()
    }

    if (status === CONTRACT_STATUS.COMPLETED) {
        contract.endDate = new Date()
    }

    await contract.save()

    return contract
}

const payContractService = async (contractId, userId, amount) => {

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }

    if (amount <= 0) {
        throw new AppError("Amount must be greater than 0", 400)
    }

    amount = Number(amount.toFixed(2))

    const contract = await Contract.findById(contractId)

    if (!contract) {
        throw new AppError("Contract not found", 404)
    }

    if (String(contract.buyerId) !== String(userId)) {
        throw new AppError("Only buyer can pay", 403)
    }

    if (contract.status !== CONTRACT_STATUS.ACTIVE) {
        throw new AppError("Contract not active", 400)
    }

    const budget = getContractBudget(contract)
    const payableCeiling = contract.type === "hourly"
        ? await getHourlyPayableByWorklog(contract)
        : budget

    const remaining = payableCeiling - contract.paidAmount

    if (amount > remaining) {
        throw new AppError("Amount exceeds remaining payable budget", 400)
    }

    contract.paidAmount += amount

    await contract.save()

    return contract
}


const getContractBalanceService = async (contractId, userId) => {

    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }

    const contract = await Contract.findById(contractId)

    if (!contract) {
        throw new AppError("Contract not found", 404)
    }

    const isOwner =
        String(contract.buyerId) === String(userId) ||
        String(contract.freelancerId) === String(userId) ||
        (contract.memberIds || []).some(id => String(id) === String(userId))

    if (!isOwner) {
        throw new AppError("Forbidden", 403)
    }

    const budget = getContractBudget(contract)
    const remaining = budget - contract.paidAmount

    return {
        total: budget,
        paid: contract.paidAmount,
        remaining
    }
}

const getContractProgressFinanceService = async (contractId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }

    const contract = await Contract.findById(contractId).lean()

    if (!contract) {
        throw new AppError("Contract not found", 404)
    }

    const isOwner =
        String(contract.buyerId) === String(userId) ||
        String(contract.freelancerId) === String(userId) ||
        (contract.memberIds || []).some(id => String(id) === String(userId))

    if (!isOwner) {
        throw new AppError("Forbidden", 403)
    }

    const [taskStats, overdueTasks] = await Promise.all([
        Task.aggregate([
            {
                $match: {
                    contractId: new mongoose.Types.ObjectId(contractId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalTasks: { $sum: 1 },
                    doneTasks: {
                        $sum: {
                            $cond: [{ $eq: ["$status", TASK_STATUS.DONE] }, 1, 0]
                        }
                    },
                    totalEffort: { $sum: "$effortPoint" },
                    doneEffort: {
                        $sum: {
                            $cond: [{ $eq: ["$status", TASK_STATUS.DONE] }, "$effortPoint", 0]
                        }
                    },
                    totalEstimatedHours: { $sum: "$estimatedHours" },
                    totalActualHours: { $sum: "$actualHours" }
                }
            }
        ]),
        Task.countDocuments({
            contractId: new mongoose.Types.ObjectId(contractId),
            dueDate: { $ne: null, $lt: new Date() },
            status: { $in: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS] }
        })
    ])

    const stats = taskStats[0] || {
        totalTasks: 0,
        doneTasks: 0,
        totalEffort: 0,
        doneEffort: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0
    }

    const progressPercent =
        stats.totalEffort === 0 ? 0 : Number(((stats.doneEffort / stats.totalEffort) * 100).toFixed(2))

    const budget = getContractBudget(contract)
    const payableNow = contract.type === "hourly"
        ? await getHourlyPayableByWorklog(contract)
        : budget

    return {
        contract: {
            id: String(contract._id),
            projectId: String(contract.projectId),
            type: contract.type,
            status: contract.status,
            price: contract.price,
            hours: contract.hours,
            paidAmount: contract.paidAmount
        },
        progress: {
            totalTasks: stats.totalTasks,
            doneTasks: stats.doneTasks,
            overdueTasks,
            totalEffort: stats.totalEffort,
            doneEffort: stats.doneEffort,
            progressPercent,
            totalEstimatedHours: stats.totalEstimatedHours,
            totalActualHours: stats.totalActualHours
        },
        finance: {
            budget,
            payableNow,
            paidAmount: contract.paidAmount,
            remainingBudget: Number((budget - contract.paidAmount).toFixed(2)),
            remainingPayableNow: Number((payableNow - contract.paidAmount).toFixed(2))
        }
    }
}

const getContractStatsService = async () => {
    const contracts = await Contract.find({}).lean()

    if (!contracts.length) {
        return {
            totalContracts: 0,
            totalRevenue: 0,
            totalPaid: 0,
            totalRemaining: 0,
            completedContracts: 0,
            activeContracts: 0
        }
    }

    return contracts.reduce((acc, contract) => {
        const budget = getContractBudget(contract)

        acc.totalContracts += 1
        acc.totalRevenue += budget
        acc.totalPaid += contract.paidAmount
        acc.totalRemaining += (budget - contract.paidAmount)

        if (contract.status === CONTRACT_STATUS.COMPLETED) acc.completedContracts += 1
        if (contract.status === CONTRACT_STATUS.ACTIVE) acc.activeContracts += 1

        return acc
    }, {
        totalContracts: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalRemaining: 0,
        completedContracts: 0,
        activeContracts: 0
    })
}

const getFreelancerStatsService = async (freelancerId, requesterId, requesterRole) => {

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

    const contracts = await Contract.find({
        freelancerId: new mongoose.Types.ObjectId(freelancerId)
    }).lean()

    if (!contracts.length) {
        return {
            totalContracts: 0,
            totalEarned: 0,
            totalValue: 0,
            avgContractValue: 0,
            completedContracts: 0,
            activeContracts: 0
        }
    }

    const base = contracts.reduce((acc, contract) => {
        const budget = getContractBudget(contract)

        acc.totalContracts += 1
        acc.totalEarned += contract.paidAmount
        acc.totalValue += budget

        if (contract.status === CONTRACT_STATUS.COMPLETED) acc.completedContracts += 1
        if (contract.status === CONTRACT_STATUS.ACTIVE) acc.activeContracts += 1

        return acc
    }, {
        totalContracts: 0,
        totalEarned: 0,
        totalValue: 0,
        completedContracts: 0,
        activeContracts: 0
    })

    return {
        ...base,
        avgContractValue: base.totalContracts > 0 ? base.totalValue / base.totalContracts : 0
    }
}

const getProjectSummaryService = async (projectId, userId) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId)
    
    if (!project) {
        throw new AppError("Project Not Found", 404)
    }

    const isBuyer = String(userId) === String(project.buyerId)
    const isFreelancer = await Contract.exists({
        projectId: project._id,
        $or: [{ freelancerId: userId }, { memberIds: userId }]
    })

    if (!isBuyer && !isFreelancer) {
        throw new AppError("You are not allowed to access", 403)
    }
    
    const contracts = await Contract.find({
        projectId: new mongoose.Types.ObjectId(projectId)
    }).lean()

    if (!contracts.length) {
        return {
            totalContracts: 0,
            totalValue: 0,
            totalPaid: 0,
            totalRemaining: 0
        }
    }

    return contracts.reduce((acc, contract) => {
        const budget = getContractBudget(contract)

        acc.totalContracts += 1
        acc.totalValue += budget
        acc.totalPaid += contract.paidAmount
        acc.totalRemaining += (budget - contract.paidAmount)

        return acc
    }, {
        totalContracts: 0,
        totalValue: 0,
        totalPaid: 0,
        totalRemaining: 0
    })
}

const getOverviewService = async () => {
    const contracts = await Contract.find({}).lean()

    const result = contracts.reduce((acc, contract) => {
        const budget = getContractBudget(contract)

        acc.totalContracts += 1
        acc.totalRevenue += budget
        acc.totalPaid += contract.paidAmount
        if (contract.status === CONTRACT_STATUS.COMPLETED) acc.completedContracts += 1
        if (contract.status === CONTRACT_STATUS.CANCELLED) acc.cancelledContracts += 1

        return acc
    }, {
        totalContracts: 0,
        totalRevenue: 0,
        totalPaid: 0,
        completedContracts: 0,
        cancelledContracts: 0
    })

    const completionRate =
        result.totalContracts > 0
            ? result.completedContracts / result.totalContracts
            : 0

    return {
        ...result,
        completionRate
    }
}

const getProjectsOverOrderBudgetService = async (userId, role, page, limit) => {
    if (!role) {
        throw new AppError("Unauthorized", 401)
    }

    const safePage = Math.max(Number(page) || 1, 1)
    const safeLimit = Math.max(Number(limit) || 10, 1)
    const skip = (safePage - 1) * safeLimit

    const projectMatch = {}

    if (role === "buyer") {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new AppError("Invalid user id", 400)
        }
        projectMatch.buyerId = new mongoose.Types.ObjectId(userId)
    } else if (role === "freelancer") {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new AppError("Invalid user id", 400)
        }

        const contracts = await Contract.find({
            $or: [{ freelancerId: userId }, { memberIds: userId }]
        }).select("projectId").lean()

        const projectIds = contracts.map(c => c.projectId)

        if (!projectIds.length) {
            return {
                data: [],
                pagination: {
                    total: 0,
                    page: safePage,
                    limit: safeLimit,
                    totalPages: 0
                }
            }
        }

        projectMatch._id = { $in: projectIds }
    }

    const rows = await Project.aggregate([
        { $match: projectMatch },
        {
            $lookup: {
                from: Order.collection.name,
                localField: "orderId",
                foreignField: "_id",
                as: "order"
            }
        },
        {
            $lookup: {
                from: Contract.collection.name,
                localField: "_id",
                foreignField: "projectId",
                as: "contracts"
            }
        },
        {
            $addFields: {
                orderTotalAmount: {
                    $ifNull: [{ $first: "$order.totalAmount" }, 0]
                },
                totalContractBudget: {
                    $sum: {
                        $map: {
                            input: "$contracts",
                            as: "c",
                            in: {
                                $cond: [
                                    { $eq: ["$$c.type", "hourly"] },
                                    { $multiply: ["$$c.price", { $ifNull: ["$$c.hours", 0] }] },
                                    "$$c.price"
                                ]
                            }
                        }
                    }
                }
            }
        },
        {
            $match: {
                $expr: { $gt: ["$totalContractBudget", "$orderTotalAmount"] }
            }
        },
        {
            $addFields: {
                overBudgetAmount: { $subtract: ["$totalContractBudget", "$orderTotalAmount"] }
            }
        },
        {
            $project: {
                _id: 1,
                orderId: 1,
                buyerId: 1,
                title: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                orderTotalAmount: 1,
                totalContractBudget: 1,
                overBudgetAmount: 1,
                contractCount: { $size: "$contracts" }
            }
        },
        { $sort: { overBudgetAmount: -1, createdAt: -1 } },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: safeLimit }
                ],
                metadata: [{ $count: "total" }]
            }
        }
    ])

    const data = rows[0]?.data || []
    const total = rows[0]?.metadata?.[0]?.total || 0

    return {
        data,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit)
        }
    }
}



module.exports = {
    createContractService, 
    getContractByIdService,
    getMyContractsService,
    updateContractService,
    updateContractStatusService,
    payContractService,
    getContractBalanceService,
    getContractProgressFinanceService,
    getContractStatsService,
    getFreelancerStatsService,
    getProjectSummaryService,
    getOverviewService,
    getProjectsOverOrderBudgetService
}