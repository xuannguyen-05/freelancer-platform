const {createOrderService, 
        getMyOrdersService, 
        getFreelancerOrdersService, 
        getOrderByIdService, 
        cancelOrderService
        } = require("../services/order.service")
    const { formatOrderSummary, formatOrderDetail } = require("../utils/formatOrder")

const createOrder = async(req, res) => {
    try {
        const userId = req.user.userID

        const packageId = req.body.packageID

        const order = await createOrderService(packageId, userId)

        res.status(201).json({
            message: "Order created successfully",
            data: formatOrderDetail(order)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
   }
}

const getMyOrders = async(req, res) => {
    try {
        const userId = req.user.userID

        const orders = await getMyOrdersService(userId)

        res.status(200).json({
            message: "Get my orders successfully",
            data: orders.map(formatOrderSummary)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
   }
}

const getFreelancerOrders = async(req, res) => {
    try {
        const userId = req.user.userID

        const orders = await getFreelancerOrdersService(userId)

        res.status(200).json({
            message: "Get freelancer orders successfully",
            data: orders.map(formatOrderSummary)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
   }
}

const getOrderById = async(req, res) => {
    try {
        const userId = req.user.userID
        const orderId = req.params.id

        const order = await getOrderByIdService(orderId, userId)

        res.status(200).json({
            message: "Get order detail successfully",
            data: formatOrderDetail(order)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
   }
}

const cancelOrder = async(req, res) => {
    try {
        const userId = req.user.userID
        const orderId = req.params.id

        const order = await cancelOrderService(orderId, userId)

        res.status(200).json({
            message: "Cancel order successfully",
            data: formatOrderDetail(order)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


module.exports = {createOrder, 
                getMyOrders, 
                getFreelancerOrders, 
                getOrderById, 
                cancelOrder
                }
