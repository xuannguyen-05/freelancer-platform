const mongoose = require("mongoose")
const Project = require("../models/project")
const Order = require("../models/order")
const Task = require("../models/task")
const Contract = require("../models/contract")
const Conversation = require("../models/conversation")
const User = require("../models/user")
const Gig = require("../models/gig")
const { PROJECT_STATUS } = require("../constants/projectStatus")
const { ORDER_STATUS } = require("../constants/orderStatus")
const { CONTRACT_STATUS } = require("../constants/contractStatus")
const { createNotificationSafe } = require("./notification.service")
const AppError = require("../utils/AppError")


const createProjectService = async(orderId, userId, description) => {
    
    const order = await Order.findById(orderId)

    if(!order){
        throw new AppError("Order Not Found", 404)
    }

    if (String(order.buyer._id) !== String(userId)) {
        throw new AppError("Only the buyer of this order can create a project", 403)
    }

    if (order.status !== ORDER_STATUS.PENDING && order.status !== "completed") {
        throw new AppError("Order is not active", 400)
    }

    if (!order.gig?.title) {
        throw new AppError("Invalid order data", 400)
    }

    const existingProject = await Project.findOne({ orderId })

    if (existingProject) {
        throw new AppError("Project already exists for this order", 400)
    }

    const project = await Project.create({
        orderId,
        buyerId: order.buyer._id,
        title: order.gig.title,
        description: description || "",
        status: PROJECT_STATUS.PLANNING
    })

    // Also auto-create contract for this project if not exists
    const existingContract = await Contract.findOne({ projectId: project._id })
    if (!existingContract && order.freelancer?._id) {
        await Contract.create({
            projectId: project._id,
            buyerId: order.buyer._id,
            freelancerId: order.freelancer._id,
            type: "fixed",
            price: Number(order.price) || 0,
            paidAmount: 0,
            status: "active",
            startDate: new Date()
        })
    }

    // Also auto-create conversation if not exists
    const existingConversation = await Conversation.findOne({ orderId })
    if (!existingConversation && order.freelancer?._id) {
        await Conversation.create({
            orderId,
            participants: [order.buyer._id, order.freelancer._id]
        })
    }

    // Cross-user Notification: Notify the freelancer that project workspace was created
    if (order.freelancer?._id) {
        createNotificationSafe({
            recipient: order.freelancer._id,
            sender: userId,
            type: "project_created",
            entityType: "project",
            entityId: project._id,
            link: `/app/projects/${project._id}`,
            metadata: {
                projectTitle: project.title,
                actorName: order.buyer.name || "Client"
            }
        })
    }

    return project
}

const getProjectByIdService = async(projectId, userId) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId).lean()

    if(!project){
        throw new AppError("Project Not Found", 404)
    }

    const order = await Order.findById(project.orderId).lean()
    const isBuyer = String(project.buyerId) === String(userId)
    const isOrderFreelancer = order && String(order.freelancer?._id) === String(userId)
    const isContractFreelancer = await Contract.exists({
        projectId: project._id,
        $or: [{ freelancerId: userId }, { memberIds: userId }]
    })

    if (!isBuyer && !isContractFreelancer && !isOrderFreelancer) {
        throw new AppError("You are not allowed to access this project", 403)
    }

    let buyerUser = null
    let freelancerUser = null
    const [buyerRes, freelancerRes, contract] = await Promise.all([
        order?.buyer?._id ? User.findById(order.buyer._id).select("name avatar email").lean() : null,
        order?.freelancer?._id ? User.findById(order.freelancer._id).select("name avatar email").lean() : null,
        Contract.findOne({ projectId: project._id }).lean()
    ])
    buyerUser = buyerRes
    freelancerUser = freelancerRes

    let contractMembers = []
    if (contract?.memberIds?.length) {
        const memberUsers = await User.find({ _id: { $in: contract.memberIds } }).select("name avatar email role").lean()
        contractMembers = memberUsers.map(u => ({
            id: String(u._id),
            _id: String(u._id),
            name: u.name,
            avatar: u.avatar,
            email: u.email,
            role: u.role
        }))
    }

    return {
        ...project,
        contract: contract ? {
            _id: String(contract._id),
            id: String(contract._id),
            buyerId: String(contract.buyerId),
            freelancerId: String(contract.freelancerId),
            memberIds: (contract.memberIds || []).map(String),
            members: contractMembers,
            type: contract.type,
            price: contract.price,
            paidAmount: contract.paidAmount,
            status: contract.status,
            createdAt: contract.createdAt
        } : null,
        order: order ? {
            _id: String(order._id),
            id: String(order._id),
            price: order.price,
            status: order.status,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            package: order.package,
            gig: order.gig,
            buyer: {
                ...order.buyer,
                avatar: buyerUser?.avatar || null,
                email: buyerUser?.email || null
            },
            freelancer: {
                ...order.freelancer,
                avatar: freelancerUser?.avatar || null,
                email: freelancerUser?.email || null
            }
        } : null
    }
}

const getMyProjectsService = async (userId, role, page, limit) => {
    if (!role) {
        throw new AppError("Unauthorized", 401)
    }

    let filter 
    if (role === "buyer") {
        filter = { buyerId: userId }
    } else if (role === "freelancer") {
        const [contracts, orders] = await Promise.all([
            Contract.find({
                $or: [{ freelancerId: userId }, { memberIds: userId }]
            }).select("projectId").lean(),
            Order.find({ "freelancer._id": userId }).select("_id").lean()
        ])
        const projectIdsFromContracts = contracts.map(c => c.projectId).filter(Boolean)
        const orderIds = orders.map(o => o._id).filter(Boolean)
        filter = {
            $or: [
                { _id: { $in: projectIdsFromContracts } },
                { orderId: { $in: orderIds } }
            ]
        }
    } else {
        throw new AppError("Invalid role", 400)
    }

    const skip = (page - 1) * limit

    const [rawProjects, total] = await Promise.all([
        Project.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Project.countDocuments(filter)
    ])

    const orderIds = rawProjects.map(p => p.orderId).filter(Boolean)
    const projectIds = rawProjects.map(p => p._id)

    const [orders, allTasks] = await Promise.all([
        Order.find({ _id: { $in: orderIds } }).lean(),
        Task.find({ projectId: { $in: projectIds } }).lean()
    ])

    const orderMap = new Map(orders.map(o => [String(o._id), o]))
    
    // Fetch gig images and user avatars in batch
    const gigIds = orders.map(o => o.gig?._id).filter(Boolean)
    const userIds = [
        ...orders.map(o => o.buyer?._id).filter(Boolean),
        ...orders.map(o => o.freelancer?._id).filter(Boolean)
    ]
    const [gigs, users] = await Promise.all([
        Gig.find({ _id: { $in: gigIds } }).select("img_url image").lean(),
        User.find({ _id: { $in: userIds } }).select("name avatar email").lean()
    ])
    const gigMap = new Map(gigs.map(g => [String(g._id), g]))
    const userMap = new Map(users.map(u => [String(u._id), u]))

    const taskMap = new Map()
    for (const task of allTasks) {
        const pid = String(task.projectId)
        if (!taskMap.has(pid)) {
            taskMap.set(pid, [])
        }
        taskMap.get(pid).push(task)
    }

    const projects = rawProjects.map(proj => {
        const order = orderMap.get(String(proj.orderId))
        const pTasks = taskMap.get(String(proj._id)) || []
        const totalTasks = pTasks.length
        const completedTasks = pTasks.filter(t => t.status === 'done').length
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (proj.status === 'completed' ? 100 : 0)

        const gigData = order ? gigMap.get(String(order.gig?._id)) : null
        const buyerData = order ? userMap.get(String(order.buyer?._id)) : null
        const freelancerData = order ? userMap.get(String(order.freelancer?._id)) : null

        const deadline = order?.deliveredAt || order?.deliveryDeadline || (order?.createdAt ? new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null)

        return {
            ...proj,
            deadline,
            taskStats: {
                total: totalTasks,
                completed: completedTasks
            },
            progress,
            order: order ? {
                id: String(order._id),
                _id: String(order._id),
                title: order.gig?.title,
                price: order.price || order.totalAmount || 0,
                status: order.status,
                createdAt: order.createdAt,
                deadline,
                gig: {
                    ...order.gig,
                    img_url: gigData?.img_url || gigData?.image || null
                },
                package: order.package,
                buyer: {
                    ...order.buyer,
                    avatar: buyerData?.avatar || null,
                    email: buyerData?.email || null
                },
                freelancer: {
                    ...order.freelancer,
                    avatar: freelancerData?.avatar || null,
                    email: freelancerData?.email || null
                }
            } : null
        }
    })

    return {
        projects,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}

const updateProjectService = async(projectId, userId, data) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId)

    if(!project){
        throw new AppError("Project Not Found", 404)
    }

    const isBuyer = String(project.buyerId) === String(userId)

    if (!isBuyer) {
        throw new AppError("Only the buyer can update this project", 403)
    }

    if (project.status !== PROJECT_STATUS.PLANNING) {
        throw new AppError("Cannot Update Project Now", 400)
    }

    const updateData = {}
    if (data.description !== undefined) updateData.description = data.description

    const updated = await Project.findByIdAndUpdate(projectId, updateData, {
        new: true,
        runValidators: true
    }).lean()

    return updated
}

const completeProjectService = async(projectId, userId) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId)

    if(!project){
        throw new AppError("Project Not Found", 404)
    }

    const isBuyer = String(project.buyerId) === String(userId)

    if (!isBuyer) {
        throw new AppError("Only the buyer can complete this project", 403)
    }
    
    if (project.status !== PROJECT_STATUS.DELIVERED) {
        throw new AppError("Cannot Update Project Now", 400)
    }

    project.status = PROJECT_STATUS.COMPLETED
    await project.save()

    await Order.findByIdAndUpdate(project.orderId, {
        status: ORDER_STATUS.COMPLETED
    })

    return project.toObject()
}

const cancelProjectService = async(projectId, userId) => {

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new AppError("Invalid Project ID", 400)
    }

    const project = await Project.findById(projectId)

    if(!project){
        throw new AppError("Project Not Found", 404)
    }

    const isBuyer = String(project.buyerId) === String(userId)
    const isFreelancer = await Contract.exists({
        projectId: project._id,
        $or: [{ freelancerId: userId }, { memberIds: userId }]
    })

    if (!isBuyer && !isFreelancer) {
        throw new AppError("Only participants can cancel this project", 403)
    }
    
    if (project.status !== PROJECT_STATUS.PLANNING && project.status !== PROJECT_STATUS.IN_PROGRESS) {
        throw new AppError("Cannot Cancel Project Now", 400)
    }

    project.status = PROJECT_STATUS.CANCELLED
    await project.save()

    await Order.findByIdAndUpdate(project.orderId, {
        status: ORDER_STATUS.CANCELLED
    })

    await Contract.updateMany(
        { projectId: project._id, status: { $ne: CONTRACT_STATUS.COMPLETED } },
        { status: CONTRACT_STATUS.CANCELLED }
    )

    return project.toObject()
}

const getProjectByOrderIdService = async(orderId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError("Invalid Order ID", 400)
    }

    const project = await Project.findOne({ orderId }).lean()
    if (!project) {
        return null
    }

    return getProjectByIdService(project._id, userId)
}

module.exports = {
    createProjectService,
    getProjectByIdService,
    getProjectByOrderIdService,
    getMyProjectsService, 
    updateProjectService,
    completeProjectService,
    cancelProjectService,
}