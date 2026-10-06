const {
  getNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService
} = require("../services/notification.service");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.userID || req.user?._id;
    const { page, limit } = req.query;
    const result = await getNotificationsService(userId, { page, limit });
    return res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.userID || req.user?._id;
    const { id } = req.params;
    const result = await markNotificationAsReadService(id, userId);
    return res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.userID || req.user?._id;
    const result = await markAllNotificationsAsReadService(userId);
    return res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
