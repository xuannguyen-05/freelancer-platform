const {createFreelancerService, 
        getMyApplicationService,
        getFreelancerByIdService, 
        getMyFreelancerService, 
        updateMyFreelancerService,
        getFreelancersService} = require("../services/freelancer.service")
const formatFreelancer = require("../utils/formatFreelancer")

const createFreelancer = async(req, res) => {
    try {
        const userId =  req.user.userID
        const application = await createFreelancerService(userId, req.body)

        res.status(201).json({
            message: "Application submitted successfully and is pending approval",
            data: application
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const getMyApplication = async(req, res) => {
    try {
        const userId = req.user.userID
        const application = await getMyApplicationService(userId)

        res.status(200).json({
            message: "Get application status successfully",
            data: application
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const getFreelancerById = async(req, res) => {
    try {
        const id = req.params.id

        const freelancer = await getFreelancerByIdService(id)

        res.status(200).json({
            message: "Get freelancer detail successfully",
            data: formatFreelancer(freelancer)
        }) 

    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const getMyFreelancer = async(req, res) => {
    try {
        const UserId =  req.user.userID

        const me = await getMyFreelancerService(UserId)

        res.status(200).json({
            message: "Get freelancer successfully",
            data: formatFreelancer(me)
        }) 

    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}


const updateMyFreelancer = async(req, res) => {
    try {
        const UserId = req.user.userID

        const me = await updateMyFreelancerService(UserId, req.body)

        res.status(200).json({
            message: "Freelancer updated successfully",
            data: formatFreelancer(me)
        }) 

    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const getFreelancers = async(req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1)
        const limit = Math.min(Number(req.query.limit) || 9, 50)
        const search = req.query.search
        const categoryID = req.query.categoryID || req.query.categoryId
        const sort = req.query.sort
        const section = req.query.section

        const result = await getFreelancersService(page, limit, search, categoryID, sort, section)

        res.status(200).json({
            message: "Get freelancers successfully",
            data: result.data,
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || "INTERNAL_ERROR",
            message: error.message
        })
    }
}

module.exports = {createFreelancer, getMyApplication, getFreelancerById, getMyFreelancer, updateMyFreelancer, getFreelancers}