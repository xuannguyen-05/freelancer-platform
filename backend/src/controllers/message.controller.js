const {sendMessageService, getMessagesByConversationService} = require("../services/message.service")
const formatMessage = require("../utils/formatMessage")

const sendMessage = async(req, res) => {
    try {
        const senderId = req.user.userID

        const {content} = req.body

        const conversationId = req.params.conversationId
        
        const message = await sendMessageService(conversationId, senderId, content)
        
        res.status(201).json({
            message: "Send message successfully",
            data: formatMessage(message)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getMessagesByConversation = async(req, res) => {
    try {
        const userId = req.user.userID
        const conversationId = req.params.conversationId
        
        const messages = await getMessagesByConversationService(conversationId, userId)
        
        res.status(200).json({
            message: "Get message successfully",
            data: messages.map(formatMessage)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


module.exports = {sendMessage, getMessagesByConversation}