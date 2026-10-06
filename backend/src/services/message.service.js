const mongoose = require("mongoose")
const Conversation = require("../models/conversation")
const Message = require("../models/message")
const User = require("../models/user")
const AppError = require("../utils/AppError")

const sendMessageService  = async(conversationId, senderId, content) => {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new AppError("Invalid Conversation ID", 400)
    }

    const conversation = await Conversation.findById(conversationId)

    if(!conversation){
        throw new AppError("Conversation Not Found", 404)
    }

    const participantIds = conversation.participants.map((id) => String(id))
    if(!participantIds.includes(String(senderId))){
        throw new AppError("Forbidden", 403)
    }

    const sender = await User.findById(senderId).select("name avatar")

    const message = await Message.create({
        conversationId,
        senderId,
        content
    })

    conversation.updatedAt = new Date()
    await conversation.save()

    return {
        ...message.toObject(),
        id: String(message._id),
        _id: String(message._id),
        senderId: String(senderId),
        senderID: String(senderId),
        sender: {
            _id: String(senderId),
            id: String(senderId),
            name: sender?.name || "",
            avatar: sender?.avatar || ""
        }
    }
}

const getMessagesByConversationService  = async(conversationId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new AppError("Invalid Conversation ID", 400)
    }

    const conversation = await Conversation.findById(conversationId).lean()

    if(!conversation){
        throw new AppError("Conversation Not Found", 404)
    }

    const participantIds = conversation.participants.map((id) => String(id))
    if(!participantIds.includes(String(userId))){
        throw new AppError("Forbidden", 403)
    }

    // Mark unread messages as read
    await Message.updateMany(
        { conversationId, senderId: { $ne: new mongoose.Types.ObjectId(userId) }, readAt: null },
        { $set: { readAt: new Date() } }
    )

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean()

    const senderIds = [...new Set(messages.map((m) => String(m.senderId)))]
    const users = await User.find({ _id: { $in: senderIds } }).select("name avatar").lean()
    const userMap = new Map(users.map((u) => [String(u._id), u]))

    return messages.map((message) => ({
        ...message,
        id: String(message._id),
        _id: String(message._id),
        senderId: String(message.senderId),
        senderID: String(message.senderId),
        sender: {
            _id: String(message.senderId),
            id: String(message.senderId),
            name: userMap.get(String(message.senderId))?.name || "",
            avatar: userMap.get(String(message.senderId))?.avatar || ""
        }
    }))
}

module.exports = {sendMessageService, getMessagesByConversationService}