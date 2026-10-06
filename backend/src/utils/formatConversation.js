const mapParticipants = (participants = []) => participants.map((p) => ({
    _id: p?._id ? String(p._id) : (typeof p === "string" ? p : undefined),
    id: p?._id ? String(p._id) : (typeof p === "string" ? p : undefined),
    name: p?.name,
    avatar: p?.avatar
}))

const mapMessages = (messages = []) => messages.map((m) => ({
    _id: m?._id ? String(m._id) : undefined,
    id: m?._id ? String(m._id) : undefined,
    content: m?.content,
    senderId: m?.senderId ? String(m.senderId) : undefined,
    senderID: m?.senderId ? String(m.senderId) : undefined,
    createdAt: m?.createdAt
}))

const normalizeConversationBase = (conversation) => {
    const convId = conversation._id ? String(conversation._id) : undefined
    const ordId = conversation.orderId ? String(conversation.orderId) : undefined
    return {
        _id: convId,
        id: convId,
        conversationId: convId,
        conversationID: convId,
        orderId: ordId,
        orderID: ordId,
        participants: mapParticipants(conversation.conversation_participants || conversation.participants || [])
    }
}

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