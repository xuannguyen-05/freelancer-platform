const mongoose = require("mongoose")
const Project = require("../models/project")
const Contract = require("../models/contract")
const User = require("../models/user")
const { PROJECT_STATUS } = require("../constants/projectStatus")
const { CONTRACT_STATUS } = require("../constants/contractStatus")
const AppError = require("../utils/AppError")


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

    if (String(data.freelancerId) !== String(project.freelancerId)) {
        throw new AppError("Freelancer must match project assignee", 400)
    }

    if (project.status !== PROJECT_STATUS.PLANNING) {
        throw new AppError("Cannot create contract for this project", 400)
    }
   
    const freelancer = await User.findById(data.freelancerId)
    if (!freelancer) {
        throw new AppError("Freelancer not found", 404)
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
    const isFreelancer = String(contract.freelancerId) === String(userId)

    if (!isBuyer && !isFreelancer) {
        throw new AppError("You are not allowed to access this contract", 403)
    }

    return contract
}

const getMyContractsService = async(userId) => {
    
    const contracts = await Contract.find({
        $or: [
            { buyerId: userId },
            { freelancerId: userId }
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

    if (!isBuyer && !isFreelancer) {
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

    const remaining = contract.price - contract.paidAmount

    if (amount > remaining) {
        throw new AppError("Amount exceeds remaining", 400)
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
        String(contract.freelancerId) === String(userId)

    if (!isOwner) {
        throw new AppError("Forbidden", 403)
    }

    const remaining = contract.price - contract.paidAmount

    return {
        total: contract.price,
        paid: contract.paidAmount,
        remaining
    }
}

const getContractStatsService = async () => {
    const stats = await Contract.aggregate(
    [
        {
            $group: {
                _id: null,

                totalContracts: { $sum: 1 },

                totalRevenue: { $sum: "$price" },

                totalPaid: { $sum: "$paidAmount" },

                totalRemaining: {
                    $sum: { $subtract: ["$price", "$paidAmount"] }
                },

                completedContracts: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "completed"] },
                            1,
                            0
                        ]
                    }
                },

                activeContracts: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "active"] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ])

    return stats[0] || {
        totalContracts: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalRemaining: 0,
        completedContracts: 0,
        activeContracts: 0
    }
}

const getFreelancerStatsService = async (freelancerId) => {

    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
        throw new AppError("Invalid Freelancer ID", 400)
    }

    const stats = await Contract.aggregate([
        {
            $match: {
                freelancerId: new mongoose.Types.ObjectId(freelancerId)
            }
        },
        {
            $group: {
                _id: null,

                totalContracts: { $sum: 1 },

                totalEarned: { $sum: "$paidAmount" },

                totalValue: { $sum: "$price" },

                avgContractValue: { $avg: "$price" },

                completedContracts: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                    }
                },

                activeContracts: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "active"] }, 1, 0]
                    }
                }
            }
        }
    ])

    return stats[0] || {
        totalContracts: 0,
        totalEarned: 0,
        totalValue: 0,
        avgContractValue: 0,
        completedContracts: 0,
        activeContracts: 0
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
    const isFreelancer = String(userId) === String(project.freelancerId)

    if (!isBuyer && !isFreelancer) {
        throw new AppError("You are not allowed to access", 403)
    }
    
    const stats = await Contract.aggregate([
        {
            $match: {
                projectId: new mongoose.Types.ObjectId(projectId)
            }
        },
        {
            $group: {
                _id: null,

                totalContracts: { $sum: 1 },

                totalValue: { $sum: "$price" },

                totalPaid: { $sum: "$paidAmount" },

                totalRemaining: {
                    $sum: { $subtract: ["$price", "$paidAmount"] }
                }
            }
        }
    ])

    return stats[0] || {
        totalContracts: 0,
        totalValue: 0,
        totalPaid: 0,
        totalRemaining: 0
    }
}

const getOverviewService = async () => {
    const stats = await Contract.aggregate([
        {
            $group: {
                _id: null,

                totalContracts: { $sum: 1 },

                totalRevenue: { $sum: "$price" },

                totalPaid: { $sum: "$paidAmount" },

                completedContracts: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                    }
                },

                cancelledContracts: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
                    }
                }
            }
        }
    ])

    const result = stats[0] || {}

    const completionRate =
        result.totalContracts > 0
            ? result.completedContracts / result.totalContracts
            : 0

    return {
        ...result,
        completionRate
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
    getContractStatsService,
    getFreelancerStatsService,
    getProjectSummaryService,
    getOverviewService
}