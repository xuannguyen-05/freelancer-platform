const Notification = require("../models/notification");
const AppError = require("../utils/AppError");

/**
 * Creates a single notification safely without breaking the caller workflow
 */
const createNotificationSafe = async ({
  recipient,
  sender = null,
  type,
  entityType,
  entityId,
  link = "",
  metadata = {}
}) => {
  try {
    if (!recipient || !type || !entityType || !entityId) {
      return null;
    }
    // Safety check: Never notify actor for their own action
    if (sender && String(recipient) === String(sender)) {
      return null;
    }

    return await Notification.create({
      recipient,
      sender,
      type,
      entityType,
      entityId,
      link,
      metadata,
      isRead: false
    });
  } catch (err) {
    // Non-blocking: log error and never disrupt business flow
    console.error("Failed to create notification:", err);
    return null;
  }
};

/**
 * Sends notifications to multiple recipients (removes actor and deduplicates)
 */
const notifyMultipleRecipients = async (recipients = [], data) => {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) return;
    const senderId = data.sender ? String(data.sender) : null;
    const uniqueRecipientIds = [
      ...new Set(
        recipients
          .filter(Boolean)
          .map(r => (typeof r === "object" && (r._id || r.id) ? String(r._id || r.id) : String(r)))
          .filter(id => id !== senderId)
      )
    ];

    await Promise.allSettled(
      uniqueRecipientIds.map(recipientId =>
        createNotificationSafe({ ...data, recipient: recipientId })
      )
    );
  } catch (err) {
    console.error("Failed to notify multiple recipients:", err);
  }
};

/**
 * Retrieves paginated notifications for an authenticated user
 */
const getNotificationsService = async (userId, { page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId })
      .populate("sender", "name avatar role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1
  };
};

/**
 * Marks a single notification as read, ensuring ownership authorization
 */
const markNotificationAsReadService = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  ).lean();

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
  return { notification, unreadCount };
};

/**
 * Marks all notifications for a user as read
 */
const markAllNotificationsAsReadService = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  return { unreadCount: 0 };
};

module.exports = {
  createNotificationSafe,
  notifyMultipleRecipients,
  getNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService
};
