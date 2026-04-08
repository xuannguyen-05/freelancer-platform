const mongoose = require("mongoose")
const Conversation = require("../models/conversation")
const Order = require("../models/order")
const Message = require("../models/message")
const User = require("../models/user")
const AppError = require("../utils/AppError")

const createConversationService  = async(orderId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError("Invalid Order ID", 400)
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const order = await Order.findById(orderId)

    if(!order){
        throw new AppError("Order Not Found", 404)
    }

    const canAccess =
        String(order.buyer._id) === String(userId) ||
        String(order.freelancer._id) === String(userId)

    if (!canAccess) {
        throw new AppError("Forbidden", 403)
    }

    let conversation = await Conversation.findOne({ orderId })

    if(!conversation){
        conversation = await Conversation.create({
            orderId,
            participants: [order.buyer._id, order.freelancer._id]
        })
    }

    return conversation.toObject()
}

const getConversationByOrderIdService = async(orderId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError("Invalid Order ID", 400)
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const conversation = await Conversation.findOne({ orderId }).lean()

    if(!conversation){
        throw new AppError("Conversation Not Found", 404)
    }

    const participantIds = conversation.participants.map((p) => String(p))
    if(!participantIds.includes(String(userId))){
        throw new AppError("Forbidden", 403)
    }

    const users = await User.find({ _id: { $in: conversation.participants } })
        .select("name avatar")
        .lean()
    const userMap = new Map(users.map((u) => [String(u._id), u]))

    const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 })
        .lean()

    return {
        ...conversation,
        participants: conversation.participants.map((id) => ({
            _id: id,
            name: userMap.get(String(id))?.name || "",
            avatar: userMap.get(String(id))?.avatar || ""
        })),
        messages
    }
}

module.exports = {createConversationService, getConversationByOrderIdService}