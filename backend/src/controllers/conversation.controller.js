const {createConversationService, getConversationByOrderIdService} = require("../services/conversation.service")
const { formatConversationSummary, formatConversationDetail } = require("../utils/formatConversation")

const createConversation = async(req, res) => {
    try {
        const userId = req.user.userID

        const {orderId} = req.body
        
        const conversation = await createConversationService(orderId, userId)
        
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

module.exports = {createConversation, getConversationByOrderId}