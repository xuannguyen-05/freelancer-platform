const mapParticipants = (participants = []) => participants.map((p) => ({
    id: p?._id ? String(p._id) : (typeof p === "string" ? p : undefined),
    name: p?.name,
    avatar: p?.avatar
}))

const mapMessages = (messages = []) => messages.map((m) => ({
    id: m?._id ? String(m._id) : undefined,
    content: m?.content,
    senderID: m?.senderId ? String(m.senderId) : undefined,
    createdAt: m?.createdAt
}))

const normalizeConversationBase = (conversation) => ({
    conversationID: conversation._id ? String(conversation._id) : undefined,
    orderID: conversation.orderId ? String(conversation.orderId) : undefined,
    participants: mapParticipants(conversation.conversation_participants || conversation.participants || [])
})

const formatConversationSummary = (conversation) => {
    if (!conversation) return null

    return normalizeConversationBase(conversation)
}

const formatConversationDetail = (conversation) => {
    if (!conversation) return null

    return {
        ...normalizeConversationBase(conversation),
        messages: mapMessages(conversation.messages || [])
    }
}

module.exports = { formatConversationSummary, formatConversationDetail }