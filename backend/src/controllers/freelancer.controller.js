const {createFreelancerService, 
        getFreelancerByIdService, 
        getMyFreelancerService, 
        updateMyFreelancerService} = require("../services/freelancer.service")
const formatFreelancer = require("../utils/formatFreelancer")

const createFreelancer = async(req, res) => {
    try {
        const userId =  req.user.userID
        const freelancer = await createFreelancerService(userId, req.body)

        res.status(201).json({
            message: "Freelancer profile created",
            data: formatFreelancer(freelancer)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
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
            message: error.message
        })
    }
}



module.exports = {createFreelancer, getFreelancerById, getMyFreelancer, updateMyFreelancer}