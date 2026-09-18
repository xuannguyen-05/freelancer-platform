const mongoose = require("mongoose")
const Project = require("../models/project")
const Order = require("../models/order")
const Task = require("../models/task")
const { PROJECT_STATUS } = require("../constants/projectStatus")
const { ORDER_STATUS } = require("../constants/orderStatus")
const AppError = require("../utils/AppError")


const createProjectService = async(orderId, userId, description) => {
    
    const order = await Order.findById(orderId)

    if(!order){
        throw new AppError("Order Not Found", 404)
    }

    if (String(order.buyer._id) !== String(userId)) {
        throw new AppError("Only the buyer of this order can create a project", 403)
    }

    if (order.status !== ORDER_STATUS.PENDING) {
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
        freelancerId: order.freelancer._id,
        title: order.gig.title,
        description: description || "",
        status: PROJECT_STATUS.PLANNING
    })

    return project
}

const getProjectByIdService = async(projectId, userId) => {

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
        throw new AppError("You are not allowed to access this project", 403)
    }

    return project
}

const getMyProjectsService = async (userId, role, page, limit) => {

    if (!role) {
        throw new AppError("Unauthorized", 401)
    }

    let filter 
    if (role === "buyer") {
        filter = { buyerId: userId }
    } else if (role === "freelancer") {
        filter = { freelancerId: userId }
    } else {
        throw new AppError("Invalid role", 400)
    }

    const skip = (page - 1) * limit

    const [projects, total] = await Promise.all([
        Project.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Project.countDocuments(filter)
    ])

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

// const acceptProjectService = async(projectId, userId) => {

//     if (!mongoose.Types.ObjectId.isValid(projectId)) {
//         throw new AppError("Invalid Project ID", 400)
//     }

//     const project = await Project.findById(projectId)

//     if(!project){
//         throw new AppError("Project Not Found", 404)
//     }

//     const isFreelancer = String(project.freelancerId) === String(userId)

//     if (!isFreelancer) {
//         throw new AppError("Only the freelancer can accept this project", 403)
//     }
    
//     if (project.status !== PROJECT_STATUS.PLANNING) {
//         throw new AppError("Cannot Update Project Now", 400)
//     }

//     project.status = PROJECT_STATUS.IN_PROGRESS
//     await project.save()

//     return project.toObject()
// }

// const deliverProjectService = async(projectId, userId) => {

//     if (!mongoose.Types.ObjectId.isValid(projectId)) {
//         throw new AppError("Invalid Project ID", 400)
//     }

//     const project = await Project.findById(projectId)

//     if(!project){
//         throw new AppError("Project Not Found", 404)
//     }

//     const isFreelancer = String(project.freelancerId) === String(userId)

//     if (!isFreelancer) {
//         throw new AppError("Only the freelancer can deliver this project", 403)
//     }
    
//     if (project.status !== PROJECT_STATUS.IN_PROGRESS) {
//         throw new AppError("Cannot Update Project Now", 400)
//     }

//     project.status = PROJECT_STATUS.DELIVERED
//     await project.save()

//     return project.toObject()
// }

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
    const isFreelancer = String(project.freelancerId) === String(userId)

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

    return project.toObject()
}


module.exports = {
    createProjectService,
    getProjectByIdService,
    getMyProjectsService, 
    updateProjectService,
    completeProjectService,
    cancelProjectService,
}