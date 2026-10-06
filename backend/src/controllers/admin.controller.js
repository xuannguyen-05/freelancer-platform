const adminService = require("../services/admin.service");

const getOverview = async (req, res, next) => {
  try {
    const data = await adminService.getOverviewService();
    res.json({
      status: "success",
      data
    });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getAnalyticsService();
    res.json({
      status: "success",
      data
    });
  } catch (err) {
    next(err);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const { status, search, page, limit } = req.query;
    const data = await adminService.getApplicationsService({ status, search, page, limit });
    res.json({
      status: "success",
      data
    });
  } catch (err) {
    next(err);
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await adminService.getApplicationByIdService(id);
    res.json({
      status: "success",
      data
    });
  } catch (err) {
    next(err);
  }
};

const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id || req.user?.userID || req.user?.userId;
    const data = await adminService.approveApplicationService(id, adminId);
    res.json({
      status: "success",
      message: "Application approved successfully",
      data
    });
  } catch (err) {
    next(err);
  }
};

const rejectApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id || req.user?.userID || req.user?.userId;
    const { reason } = req.body;
    const data = await adminService.rejectApplicationService(id, adminId, reason);
    res.json({
      status: "success",
      message: "Application rejected successfully",
      data
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  getAnalytics,
  getApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
};
