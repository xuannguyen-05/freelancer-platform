const mongoose = require("mongoose")
const Order = require("../models/order")
const Package = require("../models/package")
const Gig = require("../models/gig")
const User = require("../models/user")
const Project = require("../models/project")
const Contract = require("../models/contract")
const Task = require("../models/task")
const Review = require("../models/review")
const formatReview = require("../utils/formatReview")
const AppError = require("../utils/AppError")
const { ORDER_STATUS } = require("../constants/orderStatus")
const { PROJECT_STATUS } = require("../constants/projectStatus")
const { CONTRACT_STATUS } = require("../constants/contractStatus")
const { TASK_STATUS } = require("../constants/taskStatus")
const { createNotificationSafe } = require("./notification.service")

const SERVICE_FEE_PERCENT = 0.1

const enrichOrders = async (orders) => {
    if (!orders || orders.length === 0) return []

    const gigIds = orders.map(o => o.gig?._id).filter(Boolean)
    const freelancerIds = orders.map(o => o.freelancer?._id).filter(Boolean)
    const buyerIds = orders.map(o => o.buyer?._id).filter(Boolean)
    const orderIds = orders.map(o => o._id)

    const [gigs, freelancers, buyers, projects] = await Promise.all([
        Gig.find({ _id: { $in: gigIds } }).select("img_url image").lean(),
        User.find({ _id: { $in: freelancerIds } }).select("avatar email").lean(),
        User.find({ _id: { $in: buyerIds } }).select("avatar email").lean(),
        Project.find({ orderId: { $in: orderIds } }).select("orderId status title").lean()
    ])

    const gigMap = new Map(gigs.map(g => [String(g._id), g]))
    const freelancerMap = new Map(freelancers.map(u => [String(u._id), u]))
    const buyerMap = new Map(buyers.map(u => [String(u._id), u]))
    const projectMap = new Map(projects.map(p => [String(p.orderId), p]))

    return orders.map(order => {
        const gigData = gigMap.get(String(order.gig?._id))
        const freelancerData = freelancerMap.get(String(order.freelancer?._id))
        const buyerData = buyerMap.get(String(order.buyer?._id))
        const projectData = projectMap.get(String(order._id))

        return {
            ...order,
            gig: {
                ...order.gig,
                img_url: gigData?.img_url || gigData?.image || null
            },
            freelancer: {
                ...order.freelancer,
                avatar: freelancerData?.avatar || null,
                email: freelancerData?.email || null
            },
            buyer: {
                ...order.buyer,
                avatar: buyerData?.avatar || null,
                email: buyerData?.email || null
            },
            project: projectData ? {
                id: String(projectData._id),
                _id: String(projectData._id),
                status: projectData.status,
                title: projectData.title
            } : null
        }
    })
}

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

    const buyer = await User.findById(userId).select("name avatar role")
    if (!buyer) {
        throw new AppError("Buyer Not Found", 404)
    }

    if (buyer.role !== "buyer") {
        throw new AppError("Only buyers can purchase services", 403)
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

    // Cross-user Notification: Notify the freelancer about new incoming order
    createNotificationSafe({
        recipient: order.freelancer._id,
        sender: buyer._id,
        type: "order_created",
        entityType: "order",
        entityId: order._id,
        link: `/app/orders/${order._id}`,
        metadata: {
            orderCode: `#ORD${String(order._id).slice(-6).toUpperCase()}`,
            gigTitle: gig.title,
            actorName: buyer.name
        }
    })

    return order.toObject()
}

const getMyOrdersService = async(userId) => {
    const orders = await Order.find({ "buyer._id": userId }).sort({ createdAt: -1 }).lean()
    return enrichOrders(orders)
}

const getFreelancerOrdersService = async(userId) => {
    const orders = await Order.find({ "freelancer._id": userId }).sort({ createdAt: -1 }).lean()
    return enrichOrders(orders)
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
    
    const [gig, buyerUser, freelancerUser, pkg, project, review] = await Promise.all([
        Gig.findById(order.gig?._id).select("img_url image description").lean(),
        User.findById(order.buyer?._id).select("name avatar email").lean(),
        User.findById(order.freelancer?._id).select("name avatar email").lean(),
        Package.findById(order.package?._id).lean(),
        Project.findOne({ orderId: order._id }).lean(),
        Review.findOne({ orderId: order._id }).lean()
    ])

    const contract = project ? await Contract.findOne({ projectId: project._id }).lean() : null

    return {
        ...order,
        gig: {
            ...order.gig,
            img_url: gig?.img_url || gig?.image || null,
            description: gig?.description || ""
        },
        package: {
            ...order.package,
            deliveryDays: pkg?.deliveryDays || 7,
            revisions: pkg?.revisions ?? 2,
            features: pkg?.features || []
        },
        buyer: {
            ...order.buyer,
            name: buyerUser?.name || order.buyer.name,
            email: buyerUser?.email || null,
            avatar: buyerUser?.avatar || null
        },
        freelancer: {
            ...order.freelancer,
            name: freelancerUser?.name || order.freelancer.name,
            email: freelancerUser?.email || null,
            avatar: freelancerUser?.avatar || null
        },
        project: project ? {
            id: String(project._id),
            _id: String(project._id),
            status: project.status,
            title: project.title
        } : null,
        contract: contract ? {
            id: String(contract._id),
            _id: String(contract._id),
            type: contract.type,
            price: contract.price,
            paidAmount: Number(contract.paidAmount || 0),
            remaining: Math.max(0, (contract.type === "hourly" ? contract.price * (contract.hours || 0) : contract.price) - Number(contract.paidAmount || 0)),
            status: contract.status,
            createdAt: contract.createdAt
        } : null,
        review: review ? formatReview(review) : null
    }
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

    // Synchronize Project, Contract and Tasks
    const project = await Project.findOne({ orderId: order._id })
    if (project) {
        project.status = PROJECT_STATUS.CANCELLED
        await project.save()

        const contract = await Contract.findOne({ projectId: project._id })
        if (contract && Number(contract.paidAmount || 0) === 0) {
            contract.status = CONTRACT_STATUS.CANCELLED
            contract.endDate = new Date()
            await contract.save()
        }

        await Task.updateMany(
            {
                projectId: project._id,
                status: { $in: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS] }
            },
            { status: TASK_STATUS.CANCELLED }
        )
    }

    // Cross-user Notification: Notify the freelancer that the order was cancelled
    createNotificationSafe({
        recipient: order.freelancer._id,
        sender: userId,
        type: "order_cancelled",
        entityType: "order",
        entityId: order._id,
        link: `/app/orders/${order._id}`,
        metadata: {
            orderCode: `#ORD${String(order._id).slice(-6).toUpperCase()}`,
            actorName: order.buyer?.name || "Buyer"
        }
    })

    return order.toObject()
} 


module.exports = {createOrderService, 
                getMyOrdersService, 
                getFreelancerOrdersService, 
                getOrderByIdService, 
                cancelOrderService
                }