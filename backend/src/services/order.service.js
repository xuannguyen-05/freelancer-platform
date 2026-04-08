const mongoose = require("mongoose")
const Order = require("../models/order")
const Package = require("../models/package")
const Gig = require("../models/gig")
const User = require("../models/user")
const AppError = require("../utils/AppError")
const {ORDER_STATUS} =  require("../constants/orderStatus")

const SERVICE_FEE_PERCENT = 0.1

const createOrderService = async(packageId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
        throw new AppError("Invalid package ID", 400)
    }

    const pkg = await Package.findById(packageId)

    if(!pkg){
        throw new AppError("Package Not Found", 404)
    }

    const gig = await Gig.findById(pkg.gigId)

    if(!gig){
        throw new AppError("Gig Not Found", 404)
    }

    const buyer = await User.findById(userId).select("name avatar")
    if (!buyer) {
        throw new AppError("Buyer Not Found", 404)
    }

    const freelancer = await User.findById(gig.freelancer._id).select("name avatar")
    if (!freelancer) {
        throw new AppError("Freelancer Not Found", 404)
    }

    if(String(buyer._id) === String(freelancer._id)){
        throw new AppError("Unable to buy your own service", 400)
    }

    const price = Number(pkg.price)
    const serviceFee = Number((price * SERVICE_FEE_PERCENT).toFixed(2))
    const totalAmount = Number((price + serviceFee).toFixed(2))

    const order = await Order.create({
        buyer: {
            _id: buyer._id,
            name: buyer.name
        },
        freelancer: {
            _id: freelancer._id,
            name: freelancer.name
        },
        gig: {
            _id: gig._id,
            title: gig.title
        },
        package: {
            _id: pkg._id,
            title: pkg.title,
            price: price
        },
        price,
        serviceFee,
        totalAmount,
        status: ORDER_STATUS.PENDING
    })

    return order.toObject()
}

const getMyOrdersService = async(userId) => {
    const orders = await Order.find({ "buyer._id": userId }).sort({ createdAt: -1 }).lean()

    return orders
}

const getFreelancerOrdersService = async(userId) => {

    const orders = await Order.find({ "freelancer._id": userId }).sort({ createdAt: -1 }).lean()

    return orders
}

const getOrderByIdService = async(orderId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError("Invalid Order ID", 400)
    }

    const order = await Order.findById(orderId).lean()

    if(!order) {
        throw new AppError("Order Not Found", 404);
    }

    if(
        String(order.buyer._id) !== String(userId) &&
        String(order.freelancer._id) !== String(userId)
    ){
        throw new AppError("Forbidden", 403);
    }
    
    return order
}

const cancelOrderService = async(orderId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError("Invalid Order ID", 400)
    }

    const order = await Order.findById(orderId)

    if(!order){
        throw new AppError("Order Not Found", 404)
    }

    const isBuyer = String(order.buyer._id) === String(userId)

    if (!isBuyer) {
        throw new AppError("Only Buyer Can Cancel", 403)
    }

    if (order.status !== ORDER_STATUS.PENDING) {
        throw new AppError("Cannot Cancel This Order", 400)
    }

    order.status = ORDER_STATUS.CANCELLED
    await order.save()

    return order.toObject()
} 


module.exports = {createOrderService, 
                getMyOrdersService, 
                getFreelancerOrdersService, 
                getOrderByIdService, 
                cancelOrderService
                }