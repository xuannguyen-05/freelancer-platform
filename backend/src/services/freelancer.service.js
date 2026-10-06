const mongoose = require("mongoose")
const User = require("../models/user")
const Skill = require("../models/skill")
const Order = require("../models/order")
const Review = require("../models/review")
const AppError = require("../utils/AppError")

const FreelancerApplication = require("../models/freelancerApplication")

const skillPopulate = {
    path: "skills",
    select: "name categoryId",
    populate: {
        path: "categoryId",
        select: "name"
    }
}

const normalizeAndValidateSkillIds = async(skills) => {
    if (!Array.isArray(skills)) return undefined

    const uniqueIds = [...new Set(skills.map((s) => String(s).trim()))].filter(Boolean)

    if (uniqueIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        throw new AppError("Invalid skill ID", 400)
    }

    const existingSkills = await Skill.find({ _id: { $in: uniqueIds } }).select("_id").lean()
    if (existingSkills.length !== uniqueIds.length) {
        throw new AppError("Some skills do not exist", 400)
    }

    return uniqueIds
}

const createFreelancerService = async(userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new AppError("User not found", 404)
    }

    if (user.role === "freelancer") {
        throw new AppError("You are already a freelancer", 400)
    }

    if (user.role !== "buyer") {
        throw new AppError("Only buyers can apply to become a freelancer", 403)
    }

    // Check if user already has an active pending application
    const pendingApp = await FreelancerApplication.findOne({
        userId,
        status: "pending"
    })

    if (pendingApp) {
        throw new AppError("You already have a pending application awaiting admin approval", 400, "APPLICATION_PENDING")
    }

    const skillIds = await normalizeAndValidateSkillIds(data.skills)

    const application = await FreelancerApplication.create({
        userId,
        slogan: data.slogan.trim(),
        description: (data.description || "").trim(),
        skills: skillIds || [],
        status: "pending"
    })

    // User's role strictly remains "buyer" until approved by Admin!
    return application.toObject()
}

const getMyApplicationService = async(userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError("Invalid user ID", 400)
    }

    const application = await FreelancerApplication.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate("skills", "name categoryId")
        .lean()

    return application || null
}

const getFreelancerByIdService = async(id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid freelancer ID", 400)
    }

    const freelancer = await User.findById(id)
        .select("name avatar role bio location professionalTitle skillNames skills freelancerProfile preferences createdAt")
        .populate(skillPopulate)
        .lean()

    if(!freelancer || freelancer.role !== "freelancer"){
        throw new AppError("Freelancer Not Found", 404)
    }

    const [completedOrdersCount, totalOrdersCount, reviews] = await Promise.all([
        Order.countDocuments({ "freelancer._id": new mongoose.Types.ObjectId(id), status: "completed" }),
        Order.countDocuments({ "freelancer._id": new mongoose.Types.ObjectId(id) }),
        Review.find({ "reviewee._id": new mongoose.Types.ObjectId(id) }).select("rating").lean()
    ])

    const reviewCount = reviews.length
    const avgRating = reviewCount > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : (freelancer.freelancerProfile?.reviewCount ? Number(freelancer.freelancerProfile.rating || 0) : 0)

    const finalReviewCount = reviewCount > 0 ? reviewCount : (freelancer.freelancerProfile?.reviewCount ?? 0)

    const completionRate = totalOrdersCount > 0
        ? Math.round((completedOrdersCount / totalOrdersCount) * 100)
        : null

    return {
        ...freelancer,
        ordersCompleted: completedOrdersCount,
        totalOrders: totalOrdersCount,
        rating: avgRating,
        reviewCount: finalReviewCount,
        completionRate: completionRate
    }
}

const getMyFreelancerService = async(userId) => {

    const me = await User.findById(userId)
        .select("name avatar role skills freelancerProfile")
        .populate(skillPopulate)
        .lean()

    if(!me || me.role !== "freelancer"){
        throw new AppError("Freelancer Profile Not Found", 404);
        
    }
    
    return me
}

const updateMyFreelancerService = async(userId, data) => {
    const me = await User.findById(userId)

    if (!me || me.role !== "freelancer") {
        throw new AppError("Freelancer Profile Not Found", 404, "FREELANCER_NOT_FOUND")
    }

    if (!me.freelancerProfile) {
        me.freelancerProfile = {}
    }

    if (data.slogan !== undefined) {
        me.freelancerProfile.slogan = data.slogan
    }
    if (data.description !== undefined) {
        me.freelancerProfile.description = data.description
    }

    const skillIds = await normalizeAndValidateSkillIds(data.skills)
    if(skillIds !== undefined){
        me.skills = skillIds
    }

    await me.save()
    await me.populate(skillPopulate)
    
    return me
}

const Gig = require("../models/gig")
const { makeDiacriticRegex } = require("../utils/diacritics")

const getFreelancersService = async(page = 1, limit = 9, search, categoryID, sort, section) => {
    const skip = (page - 1) * limit
    const query = { role: "freelancer" }

    if (section === 'topRated') {
        query["freelancerProfile.rating"] = { $gte: 4.5 }
        query["freelancerProfile.reviewCount"] = { $gt: 0 }
    } else if (section === 'experienced') {
        query["freelancerProfile.reviewCount"] = { $gt: 0 }
    } else if (section === 'rising') {
        query["freelancerProfile.reviewCount"] = { $in: [0, null] }
    }

    if (categoryID && mongoose.Types.ObjectId.isValid(categoryID)) {
        const matchingGigs = await Gig.find({ "category._id": new mongoose.Types.ObjectId(categoryID) }).select("freelancer._id").lean()
        const freelancerIds = matchingGigs.map(g => g.freelancer._id)
        query._id = { $in: freelancerIds }
    }

    if (search && typeof search === 'string' && search.trim()) {
        const pattern = makeDiacriticRegex(search)
        const regex = new RegExp(pattern, "i")
        query.$or = [
            { name: regex },
            { "freelancerProfile.slogan": regex },
            { "freelancerProfile.description": regex }
        ]
    }

    let sortOptions = { "freelancerProfile.rating": -1, "freelancerProfile.reviewCount": -1, createdAt: -1 }
    if (sort === 'newest') {
        sortOptions = { createdAt: -1 }
    } else if (sort === 'topRated') {
        sortOptions = { "freelancerProfile.rating": -1, "freelancerProfile.reviewCount": -1, createdAt: -1 }
    }

    const [freelancers, total] = await Promise.all([
        User.find(query)
            .select("name email avatar bio role freelancerProfile skills createdAt")
            .populate(skillPopulate)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query)
    ])

    // Enrich with gigs information for each freelancer (categories, sample gig)
    const freelancerIds = freelancers.map(f => f._id)
    const allGigs = await Gig.find({ "freelancer._id": { $in: freelancerIds } })
        .select("title category price freelancer._id")
        .lean()

    const gigsByFreelancer = new Map()
    allGigs.forEach(g => {
        const fid = String(g.freelancer._id)
        if (!gigsByFreelancer.has(fid)) {
            gigsByFreelancer.set(fid, [])
        }
        gigsByFreelancer.get(fid).push(g)
    })

    const enriched = freelancers.map(f => {
        const fid = String(f._id)
        const myGigs = gigsByFreelancer.get(fid) || []
        const categories = [...new Set(myGigs.map(g => g.category?.name).filter(Boolean))]
        const categoryIds = [...new Set(myGigs.map(g => String(g.category?._id)).filter(Boolean))]
        const sampleGig = myGigs[0]
        const prices = myGigs.map(g => g.price).filter(p => typeof p === 'number' && p > 0)
        const startingPrice = prices.length > 0 ? Math.min(...prices) : null

        return {
            ...f,
            id: String(f._id),
            rating: f.freelancerProfile?.rating ?? 0,
            reviewCount: f.freelancerProfile?.reviewCount ?? 0,
            slogan: f.freelancerProfile?.slogan || "",
            description: f.freelancerProfile?.description || "",
            categories,
            categoryIds,
            sampleGigId: sampleGig ? String(sampleGig._id) : null,
            sampleGigTitle: sampleGig ? sampleGig.title : "",
            startingPrice
        }
    })

    const totalPages = Math.ceil(total / limit) || 1

    return {
        page,
        limit,
        total,
        totalPages,
        data: enriched
    }
}

module.exports = { 
    createFreelancerService, 
    getMyApplicationService,
    getFreelancerByIdService, 
    getMyFreelancerService, 
    updateMyFreelancerService,
    getFreelancersService
}

    