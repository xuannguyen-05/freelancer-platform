const formatMessage = (msg) => {
    if (!msg) return null

    return {
        id: msg._id ? String(msg._id) : undefined,
        content: msg.content,
        sender: {
            id: msg.sender?._id ? String(msg.sender._id) : (msg.senderId ? String(msg.senderId) : undefined),
            name: msg.sender?.name || "",
            avatar: msg.sender?.avatar || ""
        },
        readAt: msg.readAt,
        createdAt: msg.createdAt
    }
}

module.exports = formatMessage