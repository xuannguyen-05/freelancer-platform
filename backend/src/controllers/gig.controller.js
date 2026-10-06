const {getGigsService, 
        getGigByIdService, 
        createGigService, 
        updateGigService,
        deleteGigService} = require("../services/gig.service")
const { formatGigSummary, formatGigDetail } = require("../utils/formatGig")

const getGigs = async (req, res) => {
   try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Number(req.query.limit) || 9, 50)
    const categoryID = req.query.categoryID || req.query.categoryId
    const search = req.query.search
    const sort = req.query.sort
    const freelancerID = req.query.freelancerID || req.query.freelancerId

    const result = await getGigsService(page, limit, categoryID, search, sort, freelancerID)

    res.status(200).json({
        message: "Get gigs successfully",
        data: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages || Math.ceil(result.total / result.limit) || 1,
            data: result.data.map(formatGigSummary)
        },
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages || Math.ceil(result.total / result.limit) || 1
    })

   } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
   }
}

const getGigById = async (req, res) => {
    try {
        const gigId = req.params.id

        const gig = await getGigByIdService(gigId)

        res.status(200).json({
            message: "Get gig detail successfully",
            data: formatGigDetail(gig)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const createGig = async (req, res) => {
    try {
        const userId = req.user.userID

        const gig = await createGigService(userId, req.body)

        res.status(201).json({
            message: "Gig created successfully",
            data: formatGigDetail(gig)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const updateGig = async(req, res) => {
    try {
        const userId = req.user.userID
        const gigId = req.params.id

        const gig = await updateGigService(gigId, userId, req.body)

        res.status(200).json({
            message: "Gig updated successfully",
            data: formatGigDetail(gig)
        })
        
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

const deleteGig = async(req, res) => {
    try {
        const userId = req.user.userID
        const gigId = req.params.id

        const gig = await deleteGigService(gigId, userId)

        res.status(200).json({
            message: "Gig deleted successfully",
            data: null
        })
        
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: error.code || (error.statusCode >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
            message: error.message
        })
    }
}

module.exports = {getGigs, getGigById, createGig, updateGig, deleteGig}