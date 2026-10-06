const mongoose = require("mongoose");
const User = require("../models/user");
const Gig = require("../models/gig");
const Order = require("../models/order");
const Category = require("../models/category");
const Skill = require("../models/skill");
const FreelancerApplication = require("../models/freelancerApplication");
const { createNotificationSafe } = require("./notification.service");
const AppError = require("../utils/AppError");

// Helper to generate last N calendar months keys [ { key: "2026-03", label: "03/2026", start, end } ]
const getLastNMonths = (n = 6) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const key = `${year}-${month}`;
    const start = new Date(year, d.getMonth(), 1);
    const end = new Date(year, d.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({ key, label: `${month}/${year}`, monthName: `T${d.getMonth() + 1}`, start, end });
  }
  return months;
};

const getOverviewService = async () => {
  const [
    totalUsers,
    totalFreelancers,
    totalBuyers,
    totalGigs,
    totalOrders,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    revenueAgg,
    pendingApplications
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ["buyer", "freelancer"] } }),
    User.countDocuments({ role: "freelancer" }),
    User.countDocuments({ role: "buyer" }),
    Gig.countDocuments({}),
    Order.countDocuments({}),
    Order.countDocuments({ status: "completed" }),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "cancelled" }),
    Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, serviceFee: { $sum: "$serviceFee" } } }
    ]),
    FreelancerApplication.countDocuments({ status: "pending" })
  ]);

  const platformRevenue = revenueAgg[0]?.total || 0;
  const serviceFees = revenueAgg[0]?.serviceFee || 0;
  const conversionRate = totalOrders > 0 ? Number(((completedOrders / totalOrders) * 100).toFixed(1)) : 0;

  // Monthly User Growth (last 6 months)
  const months = getLastNMonths(6);
  const sixMonthsAgo = months[0].start;

  const usersMonthlyAgg = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, role: { $in: ["buyer", "freelancer"] } } },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          role: "$role"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const userGrowthMap = {};
  usersMonthlyAgg.forEach(item => {
    if (!userGrowthMap[item._id.month]) {
      userGrowthMap[item._id.month] = { buyers: 0, freelancers: 0 };
    }
    if (item._id.role === "buyer") userGrowthMap[item._id.month].buyers = item.count;
    if (item._id.role === "freelancer") userGrowthMap[item._id.month].freelancers = item.count;
  });

  const userGrowth = months.map(m => {
    const data = userGrowthMap[m.key] || { buyers: 0, freelancers: 0 };
    return {
      month: m.label,
      shortMonth: m.monthName,
      buyers: data.buyers,
      freelancers: data.freelancers,
      total: data.buyers + data.freelancers
    };
  });

  // Top Categories by Gig count
  const topCategoriesAgg = await Gig.aggregate([
    { $group: { _id: "$category.name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const topCategories = topCategoriesAgg.map(cat => ({
    name: cat._id || "Uncategorized",
    count: cat.count,
    percentage: totalGigs > 0 ? Math.round((cat.count / totalGigs) * 100) : 0
  }));

  // Recent Activities (latest orders, applications, and users)
  const [recentOrders, recentApps, recentUsers] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).limit(4).lean(),
    FreelancerApplication.find().populate("userId", "name email").sort({ createdAt: -1 }).limit(4).lean(),
    User.find({ role: { $in: ["buyer", "freelancer"] } }).sort({ createdAt: -1 }).limit(4).lean()
  ]);

  const activities = [];

  recentOrders.forEach(o => {
    activities.push({
      id: `order-${o._id}`,
      type: "order",
      title: `Order #${String(o._id).slice(-6).toUpperCase()}`,
      description: `${o.buyer?.name || "Buyer"} ordered "${o.gig?.title || "Gig"}" (${o.totalAmount?.toLocaleString()}đ)`,
      status: o.status,
      timestamp: o.createdAt
    });
  });

  recentApps.forEach(a => {
    activities.push({
      id: `app-${a._id}`,
      type: "application",
      title: `Freelancer Application`,
      description: `${a.userId?.name || "User"} applied for Freelancer status`,
      status: a.status,
      timestamp: a.createdAt
    });
  });

  recentUsers.forEach(u => {
    activities.push({
      id: `user-${u._id}`,
      type: "user",
      title: `New User Registration`,
      description: `${u.name} joined as a ${u.role}`,
      status: "active",
      timestamp: u.createdAt
    });
  });

  // Sort combined activities descending by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recentActivity = activities.slice(0, 6);

  return {
    stats: {
      totalUsers,
      totalFreelancers,
      totalBuyers,
      totalGigs,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      platformRevenue,
      serviceFees,
      conversionRate,
      pendingApplications
    },
    userGrowth,
    topCategories,
    recentActivity
  };
};

const getAnalyticsService = async () => {
  const [
    totalUsers,
    totalFreelancers,
    totalOrders,
    completedOrders,
    cancelledOrders,
    totalGigs,
    revenueAgg,
    approvedApps,
    rejectedApps
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ["buyer", "freelancer"] } }),
    User.countDocuments({ role: "freelancer" }),
    Order.countDocuments({}),
    Order.countDocuments({ status: "completed" }),
    Order.countDocuments({ status: "cancelled" }),
    Gig.countDocuments({}),
    Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, serviceFee: { $sum: "$serviceFee" } } }
    ]),
    FreelancerApplication.countDocuments({ status: "approved" }),
    FreelancerApplication.countDocuments({ status: "rejected" })
  ]);

  const platformRevenue = revenueAgg[0]?.total || 0;
  const months = getLastNMonths(6);
  const sixMonthsAgo = months[0].start;

  // Monthly User Growth
  const usersAgg = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, role: { $in: ["buyer", "freelancer"] } } },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          role: "$role"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const userGrowthMap = {};
  usersAgg.forEach(item => {
    if (!userGrowthMap[item._id.month]) {
      userGrowthMap[item._id.month] = { buyers: 0, freelancers: 0 };
    }
    if (item._id.role === "buyer") userGrowthMap[item._id.month].buyers = item.count;
    if (item._id.role === "freelancer") userGrowthMap[item._id.month].freelancers = item.count;
  });

  const userGrowth = months.map(m => {
    const data = userGrowthMap[m.key] || { buyers: 0, freelancers: 0 };
    return {
      month: m.label,
      shortMonth: m.monthName,
      buyers: data.buyers,
      freelancers: data.freelancers,
      total: data.buyers + data.freelancers
    };
  });

  // Monthly Order Trends
  const ordersAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          status: "$status"
        },
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$totalAmount", 0] } },
        serviceFee: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$serviceFee", 0] } }
      }
    }
  ]);

  const orderTrendsMap = {};
  ordersAgg.forEach(item => {
    const m = item._id.month;
    if (!orderTrendsMap[m]) {
      orderTrendsMap[m] = { total: 0, completed: 0, cancelled: 0, pending: 0, revenue: 0, serviceFee: 0 };
    }
    orderTrendsMap[m].total += item.count;
    if (item._id.status === "completed") {
      orderTrendsMap[m].completed += item.count;
      orderTrendsMap[m].revenue += item.revenue;
      orderTrendsMap[m].serviceFee += item.serviceFee;
    } else if (item._id.status === "cancelled") {
      orderTrendsMap[m].cancelled += item.count;
    } else if (item._id.status === "pending") {
      orderTrendsMap[m].pending += item.count;
    }
  });

  const orderTrends = months.map(m => {
    const d = orderTrendsMap[m.key] || { total: 0, completed: 0, cancelled: 0, pending: 0 };
    return {
      month: m.label,
      shortMonth: m.monthName,
      total: d.total,
      completed: d.completed,
      cancelled: d.cancelled,
      pending: d.pending
    };
  });

  const revenueTrends = months.map(m => {
    const d = orderTrendsMap[m.key] || { revenue: 0, serviceFee: 0 };
    return {
      month: m.label,
      shortMonth: m.monthName,
      revenue: d.revenue,
      serviceFee: d.serviceFee
    };
  });

  // Top Categories
  const topCategoriesAgg = await Gig.aggregate([
    { $group: { _id: "$category.name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);

  const topCategories = topCategoriesAgg.map(c => ({
    name: c._id || "Other",
    count: c.count,
    percentage: totalGigs > 0 ? Math.round((c.count / totalGigs) * 100) : 0
  }));

  // Health Indicators
  const completionRate = totalOrders > 0 ? Number(((completedOrders / totalOrders) * 100).toFixed(1)) : 0;
  const cancellationRate = totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0;
  const freelancerRatio = totalUsers > 0 ? Number(((totalFreelancers / totalUsers) * 100).toFixed(1)) : 0;
  const totalReviewedApps = approvedApps + rejectedApps;
  const approvalRate = totalReviewedApps > 0 ? Number(((approvedApps / totalReviewedApps) * 100).toFixed(1)) : 0;
  const averageOrderValue = completedOrders > 0 ? Math.round(platformRevenue / completedOrders) : 0;

  return {
    userGrowth,
    orderTrends,
    revenueTrends,
    topCategories,
    healthIndicators: {
      completionRate,
      cancellationRate,
      freelancerRatio,
      approvalRate,
      averageOrderValue
    }
  };
};

const getApplicationsService = async ({ status, search, page = 1, limit = 10 }) => {
  const query = {};

  // Status filtering
  if (status && status !== "all") {
    query.status = status;
  }

  // Search filtering by user name or email
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    const matchedUsers = await User.find({
      $or: [{ name: regex }, { email: regex }]
    }).select("_id");
    const matchedUserIds = matchedUsers.map(u => u._id);
    query.userId = { $in: matchedUserIds };
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (p - 1) * l;

  const [applications, total, pendingCount, approvedCount, rejectedCount, allCount] = await Promise.all([
    FreelancerApplication.find(query)
      .populate("userId", "name email avatar createdAt")
      .populate("skills", "name")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    FreelancerApplication.countDocuments(query),
    FreelancerApplication.countDocuments({ status: "pending" }),
    FreelancerApplication.countDocuments({ status: "approved" }),
    FreelancerApplication.countDocuments({ status: "rejected" }),
    FreelancerApplication.countDocuments({})
  ]);

  return {
    applications,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    },
    counts: {
      all: allCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    }
  };
};

const getApplicationByIdService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid application ID", 400);
  }

  const application = await FreelancerApplication.findById(id)
    .populate("userId", "name email avatar bio location createdAt")
    .populate("skills", "name")
    .populate("reviewedBy", "name email")
    .lean();

  if (!application) {
    throw new AppError("Freelancer application not found", 404);
  }

  return application;
};

const approveApplicationService = async (id, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid application ID", 400);
  }

  const application = await FreelancerApplication.findById(id);
  if (!application) {
    throw new AppError("Freelancer application not found", 404);
  }

  if (application.status !== "pending") {
    throw new AppError("Application has already been processed", 400);
  }

  // Atomically approve
  application.status = "approved";
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  await application.save();

  // Update user role to freelancer and set profile
  const user = await User.findById(application.userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.role = "freelancer";
  user.freelancerProfile = {
    slogan: application.slogan,
    description: application.description,
    level: 1,
    rating: 0,
    reviewCount: 0
  };
  user.skills = application.skills;
  await user.save();

  // Send cross-user notification
  await createNotificationSafe({
    recipient: application.userId,
    sender: adminId,
    type: "freelancer_approved",
    entityType: "application",
    entityId: application._id,
    link: "/app/gigs",
    metadata: {
      applicationId: application._id.toString()
    }
  });

  return await getApplicationByIdService(id);
};

const rejectApplicationService = async (id, adminId, reason = "") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid application ID", 400);
  }

  const application = await FreelancerApplication.findById(id);
  if (!application) {
    throw new AppError("Freelancer application not found", 404);
  }

  if (application.status !== "pending") {
    throw new AppError("Application has already been processed", 400);
  }

  // Atomically reject
  application.status = "rejected";
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  application.rejectionReason = (reason || "").trim();
  await application.save();

  // User role remains buyer!

  // Send cross-user notification
  await createNotificationSafe({
    recipient: application.userId,
    sender: adminId,
    type: "freelancer_rejected",
    entityType: "application",
    entityId: application._id,
    link: "/app/become-freelancer",
    metadata: {
      applicationId: application._id.toString(),
      reason: application.rejectionReason
    }
  });

  return await getApplicationByIdService(id);
};

module.exports = {
  getOverviewService,
  getAnalyticsService,
  getApplicationsService,
  getApplicationByIdService,
  approveApplicationService,
  rejectApplicationService
};
