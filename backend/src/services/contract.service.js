const mongoose = require("mongoose")
const Project = require("../models/project")
const Contract = require("../models/contract")
const User = require("../models/user")
const Task = require("../models/task")
const Order = require("../models/order")
const Gig = require("../models/gig")
const { PROJECT_STATUS } = require("../constants/projectStatus")
const { CONTRACT_STATUS } = require("../constants/contractStatus")
const { TASK_STATUS } = require("../constants/taskStatus")
const { ORDER_STATUS } = require("../constants/orderStatus")
const { createNotificationSafe, notifyMultipleRecipients } = require("./notification.service")
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
        status: CONTRACT_STATUS.ACTIVE
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
        status: CONTRACT_STATUS.ACTIVE,
        startDate: new Date(),
        endDate: null
    })

    return contract
}

const getContractByIdService = async(contractId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }
    
    const contract = await Contract.findById(contractId).lean()

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

    const [project, buyer, freelancer, members] = await Promise.all([
        contract.projectId ? Project.findById(contract.projectId).lean() : null,
        contract.buyerId ? User.findById(contract.buyerId).select("name avatar email role").lean() : null,
        contract.freelancerId ? User.findById(contract.freelancerId).select("name avatar email role").lean() : null,
        (contract.memberIds && contract.memberIds.length) ? User.find({ _id: { $in: contract.memberIds } }).select("name avatar email role").lean() : []
    ])

    let order = null
    if (project?.orderId) {
        const rawOrder = await Order.findById(project.orderId).lean()
        if (rawOrder) {
            const gigData = rawOrder.gig?._id ? await Gig.findById(rawOrder.gig._id).select("img_url image").lean() : null
            order = {
                id: String(rawOrder._id),
                _id: String(rawOrder._id),
                title: rawOrder.gig?.title || project.title,
                price: rawOrder.price,
                totalAmount: rawOrder.totalAmount,
                status: rawOrder.status,
                image: gigData?.img_url || gigData?.image || null
            }
        }
    }

    return {
        ...contract,
        buyer: buyer ? {
            id: String(buyer._id),
            _id: String(buyer._id),
            name: buyer.name,
            avatar: buyer.avatar,
            email: buyer.email,
            role: buyer.role
        } : null,
        freelancer: freelancer ? {
            id: String(freelancer._id),
            _id: String(freelancer._id),
            name: freelancer.name,
            avatar: freelancer.avatar,
            email: freelancer.email,
            role: freelancer.role
        } : null,
        members: (members || []).map(m => ({
            id: String(m._id),
            _id: String(m._id),
            name: m.name,
            avatar: m.avatar,
            email: m.email,
            role: m.role
        })),
        project: project ? {
            id: String(project._id),
            _id: String(project._id),
            title: project.title,
            status: project.status,
            orderId: project.orderId ? String(project.orderId) : null
        } : null,
        order
    }
}

const getMyContractsService = async(userId) => {
    const rawContracts = await Contract.find({
        $or: [
            { buyerId: userId },
            { freelancerId: userId },
            { memberIds: userId }
        ]
    }).sort({ createdAt: -1 }).lean()

    if (!rawContracts.length) return []

    const projectIds = rawContracts.map(c => c.projectId).filter(Boolean)
    const userIds = [
        ...rawContracts.map(c => c.buyerId).filter(Boolean),
        ...rawContracts.map(c => c.freelancerId).filter(Boolean),
        ...rawContracts.flatMap(c => c.memberIds || []).filter(Boolean)
    ]

    const [projects, users] = await Promise.all([
        Project.find({ _id: { $in: projectIds } }).lean(),
        User.find({ _id: { $in: userIds } }).select("name avatar email role").lean()
    ])

    const projectMap = new Map(projects.map(p => [String(p._id), p]))
    const userMap = new Map(users.map(u => [String(u._id), u]))

    const orderIds = projects.map(p => p.orderId).filter(Boolean)
    const orders = await Order.find({ _id: { $in: orderIds } }).lean()
    const orderMap = new Map(orders.map(o => [String(o._id), o]))

    const gigIds = orders.map(o => o.gig?._id).filter(Boolean)
    const gigs = await Gig.find({ _id: { $in: gigIds } }).select("img_url image").lean()
    const gigMap = new Map(gigs.map(g => [String(g._id), g]))

    return rawContracts.map(contract => {
        const project = projectMap.get(String(contract.projectId))
        const buyer = userMap.get(String(contract.buyerId))
        const freelancer = userMap.get(String(contract.freelancerId))
        const order = project ? orderMap.get(String(project.orderId)) : null
        const gigData = order ? gigMap.get(String(order.gig?._id)) : null

        return {
            ...contract,
            buyer: buyer ? {
                id: String(buyer._id),
                _id: String(buyer._id),
                name: buyer.name,
                avatar: buyer.avatar,
                email: buyer.email,
                role: buyer.role
            } : null,
            freelancer: freelancer ? {
                id: String(freelancer._id),
                _id: String(freelancer._id),
                name: freelancer.name,
                avatar: freelancer.avatar,
                email: freelancer.email,
                role: freelancer.role
            } : null,
            members: (contract.memberIds || [])
                .map(id => userMap.get(String(id)))
                .filter(Boolean)
                .map(u => ({
                    id: String(u._id),
                    _id: String(u._id),
                    name: u.name,
                    avatar: u.avatar,
                    email: u.email,
                    role: u.role
                })),
            project: project ? {
                id: String(project._id),
                _id: String(project._id),
                title: project.title,
                status: project.status,
                orderId: project.orderId
            } : null,
            order: order ? {
                id: String(order._id),
                _id: String(order._id),
                title: order.gig?.title,
                price: order.price,
                deliveryDeadline: order.deliveredAt || order.deliveryDeadline,
                gig: {
                    ...order.gig,
                    img_url: gigData?.img_url || gigData?.image || null
                }
            } : null
        }
    })
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

    if (contract.status !== CONTRACT_STATUS.ACTIVE || contract.paidAmount > 0) {
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
        throw new AppError("Contract is already active", 400)
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

        if (contract.status === CONTRACT_STATUS.COMPLETED || contract.status === CONTRACT_STATUS.CANCELLED) {
            throw new AppError("Cannot cancel completed or already cancelled contract", 400)
        }

        if (Number(contract.paidAmount || 0) > 0) {
            throw new AppError("Cannot cancel contract with existing payments", 400)
        }
    }

    contract.status = status

    if (status === CONTRACT_STATUS.COMPLETED || status === CONTRACT_STATUS.CANCELLED) {
        contract.endDate = new Date()
    }

    await contract.save()

    // Synchronize Project, Order and Tasks
    if (status === CONTRACT_STATUS.CANCELLED) {
        const project = await Project.findById(contract.projectId)
        if (project) {
            project.status = PROJECT_STATUS.CANCELLED
            await project.save()

            if (project.orderId) {
                await Order.findByIdAndUpdate(project.orderId, {
                    status: ORDER_STATUS.CANCELLED
                })
            }

            await Task.updateMany(
                {
                    projectId: project._id,
                    status: { $in: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS] }
                },
                { status: TASK_STATUS.CANCELLED }
            )
        }

        // Cross-user Notification: Notify counterpart about contract cancellation
        const counterpartId = String(contract.freelancerId) === String(userId) ? contract.buyerId : contract.freelancerId
        createNotificationSafe({
            recipient: counterpartId,
            sender: userId,
            type: "contract_cancelled",
            entityType: "contract",
            entityId: contract._id,
            link: `/app/contracts/${contract._id}`,
            metadata: {
                contractCode: `#HD${String(contract._id).slice(-6).toUpperCase()}`
            }
        })
    } else if (status === CONTRACT_STATUS.COMPLETED) {
        const project = await Project.findById(contract.projectId)
        if (project) {
            project.status = PROJECT_STATUS.COMPLETED
            await project.save()

            if (project.orderId) {
                await Order.findByIdAndUpdate(project.orderId, {
                    status: ORDER_STATUS.COMPLETED,
                    deliveredAt: new Date()
                })
            }
        }
    }

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

    contract.paidAmount = Number((contract.paidAmount + amount).toFixed(2))

    if (contract.paidAmount >= contract.price) {
        contract.status = CONTRACT_STATUS.COMPLETED
        contract.endDate = new Date()

        const project = await Project.findById(contract.projectId)
        if (project?.orderId) {
            await Order.findByIdAndUpdate(project.orderId, {
                status: ORDER_STATUS.COMPLETED,
                deliveredAt: new Date()
            })
            await Project.findByIdAndUpdate(project._id, {
                status: PROJECT_STATUS.COMPLETED
            })
        }
    }

    await contract.save()

    // Cross-user Notification: Notify Freelancer Lead about received payment
    createNotificationSafe({
        recipient: contract.freelancerId,
        sender: userId,
        type: "payment_received",
        entityType: "contract",
        entityId: contract._id,
        link: `/app/contracts/${contract._id}`,
        metadata: {
            amount,
            contractCode: `#HD${String(contract._id).slice(-6).toUpperCase()}`
        }
    })

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

const addContractMemberService = async (contractId, userId, email) => {
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }

    const contract = await Contract.findById(contractId)
    if (!contract) {
        throw new AppError("Contract not found", 404)
    }

    // Only contract lead (freelancer) can manage team members
    const isLead = String(contract.freelancerId) === String(userId)
    if (!isLead) {
        throw new AppError("Only contract lead can manage members", 403)
    }

    if (!email || typeof email !== "string" || !email.trim()) {
        throw new AppError("Freelancer email is required", 400)
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
        throw new AppError("User not found with this email", 404)
    }

    if (user.role !== "freelancer") {
        throw new AppError("User must have freelancer role", 400)
    }

    if (String(user._id) === String(contract.freelancerId)) {
        throw new AppError("User is already the contract lead", 400)
    }

    if (String(user._id) === String(contract.buyerId)) {
        throw new AppError("Buyer cannot be a contract member", 400)
    }

    const currentMemberIds = (contract.memberIds || []).map(String)
    if (currentMemberIds.includes(String(user._id))) {
        throw new AppError("User is already a team member", 400)
    }

    contract.memberIds.push(user._id)
    await contract.save()

    // Cross-user Notification: Notify the added freelancer
    const projectAdded = await Project.findById(contract.projectId).select("title").lean()
    createNotificationSafe({
        recipient: user._id,
        sender: userId,
        type: "member_added",
        entityType: "project",
        entityId: contract.projectId,
        link: `/app/projects/${contract.projectId}`,
        metadata: {
            projectTitle: projectAdded?.title || "Project"
        }
    })

    return await getContractByIdService(contract._id, userId)
}

const removeContractMemberService = async (contractId, userId, memberId) => {
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
        throw new AppError("Invalid Contract ID", 400)
    }

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new AppError("Invalid Member ID", 400)
    }

    const contract = await Contract.findById(contractId)
    if (!contract) {
        throw new AppError("Contract not found", 404)
    }

    // Only contract lead (freelancer) can manage team members
    const isLead = String(contract.freelancerId) === String(userId)
    if (!isLead) {
        throw new AppError("Only contract lead can manage members", 403)
    }

    const currentMemberIds = (contract.memberIds || []).map(String)
    const targetIndex = currentMemberIds.indexOf(String(memberId))

    if (targetIndex === -1) {
        throw new AppError("Member not found in contract", 404)
    }

    contract.memberIds.splice(targetIndex, 1)
    await contract.save()

    // Cross-user Notification: Notify the removed freelancer
    const projectRemoved = await Project.findById(contract.projectId).select("title").lean()
    createNotificationSafe({
        recipient: memberId,
        sender: userId,
        type: "member_removed",
        entityType: "project",
        entityId: contract.projectId,
        link: "/app/projects",
        metadata: {
            projectTitle: projectRemoved?.title || "Project"
        }
    })

    return await getContractByIdService(contract._id, userId)
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
    getProjectsOverOrderBudgetService,
    addContractMemberService,
    removeContractMemberService
}