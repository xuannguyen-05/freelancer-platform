const mongoose = require("mongoose")
const Conversation = require("../models/conversation")
const Order = require("../models/order")
const Message = require("../models/message")
const User = require("../models/user")
const AppError = require("../utils/AppError")

const createConversationService = async (orderId, userId, targetUserId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    // 1. If orderId is provided, find or create conversation for that order
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        const order = await Order.findById(orderId)
        if (!order) {
            throw new AppError("Order Not Found", 404)
        }

        const canAccess =
            String(order.buyer._id) === String(userId) ||
            String(order.freelancer._id) === String(userId)

        if (!canAccess) {
            throw new AppError("Forbidden", 403)
        }

        let conversation = await Conversation.findOne({ orderId })
        if (!conversation) {
            conversation = await Conversation.create({
                orderId,
                participants: [order.buyer._id, order.freelancer._id]
            })
        }
        return conversation.toObject()
    }

    // 2. If targetUserId is provided (direct contact from Freelancer profile)
    if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
        if (String(userId) === String(targetUserId)) {
            throw new AppError("Cannot create conversation with yourself", 400)
        }

        const targetUser = await User.findById(targetUserId)
        if (!targetUser) {
            throw new AppError("Target user not found", 404)
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(targetUserId)] }
        })

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(targetUserId)]
            })
        }

        return conversation.toObject()
    }

    throw new AppError("Either orderId or targetUserId must be provided", 400)
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

    // Mark unread messages as read
    await Message.updateMany(
        { conversationId: conversation._id, senderId: { $ne: new mongoose.Types.ObjectId(userId) }, readAt: null },
        { $set: { readAt: new Date() } }
    )

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

const getMyConversationsService = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const conversations = await Conversation.find({
        participants: new mongoose.Types.ObjectId(userId)
    })
    .sort({ updatedAt: -1 })
    .lean()

    if (conversations.length === 0) return []

    // Collect all participant user IDs
    const allParticipantIds = [...new Set(conversations.flatMap(c => c.participants.map(p => String(p))))]
    const users = await User.find({ _id: { $in: allParticipantIds } }).select("name avatar email").lean()
    const userMap = new Map(users.map(u => [String(u._id), u]))

    // Collect all order IDs
    const orderIds = [...new Set(conversations.map(c => c.orderId).filter(Boolean))]
    const orders = await Order.find({ _id: { $in: orderIds } }).select("gig.title price status buyer freelancer").lean()
    const orderMap = new Map(orders.map(o => [String(o._id), o]))

    const enrichedConversations = await Promise.all(conversations.map(async (c) => {
        const otherParticipantId = c.participants.find(p => String(p) !== String(userId))
        const partnerUser = otherParticipantId ? userMap.get(String(otherParticipantId)) : null
        const order = c.orderId ? orderMap.get(String(c.orderId)) : null

        const [lastMsg, unreadCount] = await Promise.all([
            Message.findOne({ conversationId: c._id }).sort({ createdAt: -1 }).lean(),
            Message.countDocuments({
                conversationId: c._id,
                senderId: { $ne: new mongoose.Types.ObjectId(userId) },
                readAt: null
            })
        ])

        return {
            id: String(c._id),
            _id: String(c._id),
            conversationId: String(c._id),
            orderId: c.orderId ? String(c.orderId) : null,
            orderTitle: order?.gig?.title || null,
            orderStatus: order?.status || null,
            partner: {
                id: otherParticipantId ? String(otherParticipantId) : null,
                _id: otherParticipantId ? String(otherParticipantId) : null,
                name: partnerUser?.name || "User",
                avatar: partnerUser?.avatar || null
            },
            lastMessage: lastMsg ? {
                id: String(lastMsg._id),
                content: lastMsg.content,
                createdAt: lastMsg.createdAt,
                senderId: String(lastMsg.senderId)
            } : null,
            unreadCount: unreadCount || 0,
            updatedAt: c.updatedAt || c.createdAt
        }
    }))

    // Only show direct conversations if they have at least one message.
    // Conversations tied to an order are always kept even without messages.
    const activeConversations = enrichedConversations.filter(c => Boolean(c.orderId) || Boolean(c.lastMessage))

    activeConversations.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt || a.updatedAt
        const timeB = b.lastMessage?.createdAt || b.updatedAt
        return new Date(timeB) - new Date(timeA)
    })

    return activeConversations
}

const getUnreadMessageCountService = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const conversations = await Conversation.find({
        participants: new mongoose.Types.ObjectId(userId)
    }).select("_id").lean()

    if (conversations.length === 0) return { unreadCount: 0 }

    const convIds = conversations.map(c => c._id)
    const unreadCount = await Message.countDocuments({
        conversationId: { $in: convIds },
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        readAt: null
    })

    return { unreadCount }
}

module.exports = {
    createConversationService, 
    getConversationByOrderIdService,
    getMyConversationsService,
    getUnreadMessageCountService
}