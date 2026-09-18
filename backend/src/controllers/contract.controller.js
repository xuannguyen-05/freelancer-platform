const {createContractService, 
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
} = require("../services/contract.service")
const {formatContractSummary, formatContractDetail} = require("../utils/formatContract")

const createContract = async(req, res) => {
    try {
        const userId = req.user.userID

        const {projectId} = req.body

        const contract = await createContractService(projectId, userId, req.body)

        res.status(201).json({
            message: "Contract created successfully",
            data: formatContractDetail(contract)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getContractById = async(req, res) => {
    try {
        const userId = req.user.userID

        const contractId = req.params.id

        const contract = await getContractByIdService(contractId, userId)

        res.status(200).json({
            message: "Get contract detail successfully",
            data: formatContractDetail(contract)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getMyContracts = async(req, res) => {
    try {
        const userId = req.user.userID

        const contracts = await getMyContractsService(userId)

        res.status(200).json({
            message: "Get contracts successfully",
            data: contracts.map(formatContractSummary)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const updateContract = async(req, res) => {
    try {

        const userId = req.user.userID

        const contractId = req.params.id

        const contract = await updateContractService(contractId, userId, req.body)

        res.status(200).json({
            message: "Update contract successfully",
            data: formatContractDetail(contract)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const updateContractStatus = async(req, res) => {
    try {

        const userId = req.user.userID

        const contractId = req.params.id

        const {status} = req.body

        const contract = await updateContractStatusService(contractId, userId, status)

        res.status(200).json({
            message: "Update contract status successfully",
            data: formatContractDetail(contract)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const payContract = async(req, res) => {
    try {

        const userId = req.user.userID

        const contractId = req.params.id

        const { amount } = req.body

        const pay = await payContractService(contractId, userId, amount)

        res.status(200).json({
            message: "Payment successful",
            data: formatContractDetail(pay)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getContractBalance = async(req, res) => {
    try {

        const userId = req.user.userID

        const contractId = req.params.id

        const balance = await getContractBalanceService(contractId, userId)

        res.status(200).json({
            message: "Get contract balance successful",
            data: balance
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getContractProgressFinance = async (req, res) => {
    try {
        const userId = req.user.userID
        const contractId = req.params.id

        const summary = await getContractProgressFinanceService(contractId, userId)

        res.status(200).json({
            message: "Get contract progress finance successfully",
            data: summary
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getContractStats = async (req, res) => {
    try {
        const stats = await getContractStatsService()

        res.status(200).json({
            message: "Get contract stats successfully",
            data: stats
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getFreelancerStats = async (req, res) => {
    try {
        
        const freelancerId = req.params.id

        const stats = await getFreelancerStatsService(
            freelancerId,
            req.user.userID,
            req.user.role
        )

        res.status(200).json({
            message: "Get freelancer stats successfully",
            data: stats
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getProjectSummary = async (req, res) => {
    try {
        
        const userId = req.user.userID

        const projectId = req.params.projectId

        const summary = await getProjectSummaryService(projectId, userId)

        res.status(200).json({
            message: "Get project summary successfully",
            data: summary
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getOverview = async (req, res) => {
    try {
        
        const overview = await getOverviewService()

        res.status(200).json({
            message: "Get over view successfully",
            data: overview
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getProjectsOverOrderBudget = async (req, res) => {
    try {
        const userId = req.user.userID
        const role = req.user.role
        const { page = 1, limit = 10 } = req.query

        const result = await getProjectsOverOrderBudgetService(
            userId,
            role,
            Number(page),
            Number(limit)
        )

        res.status(200).json({
            message: "Get projects over order budget successfully",
            data: result.data,
            pagination: result.pagination
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


module.exports = {createContract,
                    getContractById,
                    getMyContracts,
                    updateContract,
                    updateContractStatus,
                    payContract,
                    getContractBalance,
                    getContractProgressFinance,
                    getContractStats,
                    getFreelancerStats,
                    getProjectSummary,
                    getOverview,
                    getProjectsOverOrderBudget
                }