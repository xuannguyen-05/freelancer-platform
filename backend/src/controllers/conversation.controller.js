const {
    createConversationService, 
    getConversationByOrderIdService,
    getMyConversationsService,
    getUnreadMessageCountService
} = require("../services/conversation.service")
const { formatConversationSummary, formatConversationDetail } = require("../utils/formatConversation")

const createConversation = async(req, res) => {
    try {
        const userId = req.user.userID

        const { orderId, targetUserId, partnerId } = req.body
        
        const conversation = await createConversationService(orderId, userId, targetUserId || partnerId)
        
        res.status(201).json({
            message: "Conversation created",
            data: formatConversationSummary(conversation)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getConversationByOrderId = async(req, res) => {
    try {
        const userId = req.user.userID
        const orderId = req.params.orderId
        
        const conversation = await getConversationByOrderIdService(orderId, userId)
        
        res.status(200).json({
            message: "Conversation retrieved",
            data: formatConversationDetail(conversation)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getMyConversations = async(req, res) => {
    try {
        const userId = req.user.userID
        const conversations = await getMyConversationsService(userId)
        
        res.status(200).json({
            message: "Conversations retrieved",
            data: conversations
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getUnreadCount = async(req, res) => {
    try {
        const userId = req.user.userID
        const data = await getUnreadMessageCountService(userId)
        
        res.status(200).json({
            message: "Unread count retrieved",
            data
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

module.exports = {
    createConversation, 
    getConversationByOrderId,
    getMyConversations,
    getUnreadCount
}