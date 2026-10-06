const mongoose = require("mongoose")
const Gig = require("../models/gig")
const Package = require("../models/package")
const User = require("../models/user")
const Category = require("../models/category")
const Order = require("../models/order")
const Review = require("../models/review")
const AppError = require("../utils/AppError")
const { deleteFromCloudinary } = require("./cloudinary.service")
const { makeDiacriticRegex } = require("../utils/diacritics")

const getGigsService = async (page, limit, categoryID, search, sort, freelancerID) => {
    const skip = (page - 1) * limit
    const where = {}

    if (freelancerID && mongoose.Types.ObjectId.isValid(freelancerID)) {
        where["freelancer._id"] = new mongoose.Types.ObjectId(freelancerID)
    }

    if (categoryID) {
        if (!mongoose.Types.ObjectId.isValid(categoryID)) {
            throw new AppError("Invalid category ID", 400, "INVALID_CATEGORY_ID")
        }
        where["category._id"] = new mongoose.Types.ObjectId(categoryID)
    }

    if (search && typeof search === 'string' && search.trim()) {
        const pattern = makeDiacriticRegex(search)
        const regex = new RegExp(pattern, "i")
        where.$or = [
            { title: regex },
            { tags: regex },
            { description: regex },
            { "freelancer.name": regex },
            { "category.name": regex }
        ]
    }

    let sortOptions = { createdAt: -1 }
    if (sort === 'topRated') {
        sortOptions = { rating: -1, reviewCount: -1, createdAt: -1 }
    } else if (sort === 'priceAsc') {
        sortOptions = { price: 1, createdAt: -1 }
    } else if (sort === 'priceDesc') {
        sortOptions = { price: -1, createdAt: -1 }
    } else if (sort === 'newest') {
        sortOptions = { createdAt: -1 }
    }

    const [gigs, total] = await Promise.all([
        Gig.find(where)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        Gig.countDocuments(where)
    ])

    const totalPages = Math.ceil(total / limit) || 1

    return {
        page,
        limit,
        total,
        totalPages,
        data: gigs
    }
}

const getGigByIdService = async (gigId) => {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
        throw new AppError("Invalid Gig ID", 400)
    }

    const gig = await Gig.findById(gigId).lean()

    if (!gig) {
        throw new AppError("Gig not found", 404)
    }

    const [gigPackages, freelancerUser] = await Promise.all([
        Package.find({ gigId: gig._id }).sort({ price: 1 }).lean(),
        gig.freelancer?._id
            ? User.findById(gig.freelancer._id)
                .select("name avatar role bio location professionalTitle skillNames skills freelancerProfile createdAt")
                .populate({ path: "skills", select: "name" })
                .lean()
            : Promise.resolve(null)
    ])

    let freelancerDetail = null
    if (freelancerUser) {
        const [completedOrdersCount, totalOrdersCount, reviews] = await Promise.all([
            Order.countDocuments({ "freelancer._id": freelancerUser._id, status: "completed" }),
            Order.countDocuments({ "freelancer._id": freelancerUser._id }),
            Review.find({ "reviewee._id": freelancerUser._id }).select("rating").lean()
        ])

        const rCount = reviews.length
        const avgR = rCount > 0
            ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / rCount).toFixed(1))
            : (freelancerUser.freelancerProfile?.reviewCount ? Number(freelancerUser.freelancerProfile.rating || 0) : 0)

        const finalReviewCount = rCount > 0 ? rCount : (freelancerUser.freelancerProfile?.reviewCount ?? 0)

        const completionRate = totalOrdersCount > 0
            ? Math.round((completedOrdersCount / totalOrdersCount) * 100)
            : null

        const skillNameList = freelancerUser.skillNames?.length > 0
            ? freelancerUser.skillNames
            : (freelancerUser.skills?.map(s => s.name).filter(Boolean) || [])

        freelancerDetail = {
            id: String(freelancerUser._id),
            userID: String(freelancerUser._id),
            name: freelancerUser.name,
            avatar: freelancerUser.avatar || gig.freelancer?.avatar || "",
            bio: freelancerUser.bio || freelancerUser.freelancerProfile?.description || "",
            location: freelancerUser.location || "",
            professionalTitle: freelancerUser.professionalTitle || freelancerUser.freelancerProfile?.slogan || "",
            skills: skillNameList,
            createdAt: freelancerUser.createdAt,
            ordersCompleted: completedOrdersCount,
            totalOrders: totalOrdersCount,
            rating: avgR,
            reviewCount: finalReviewCount,
            completionRate: completionRate
        }
    }

    return {
        ...gig,
        gig_packages: gigPackages,
        freelancerDetail
    }
}

const createGigService = async(userId, data) => {

    const user = await User.findById(userId).select("name avatar role freelancerProfile")

    if(!user || user.role !== "freelancer"){
        throw new AppError("You must become freelancer first", 403)
    }

    if (!data.categoryID || !mongoose.Types.ObjectId.isValid(data.categoryID)) {
        throw new AppError("Invalid category ID", 400)
    }

    const category = await Category.findById(data.categoryID).select("name description")

    if (!category) {
        throw new AppError("Category not found", 404)
    }

    if (!Array.isArray(data.packages) || data.packages.length === 0) {
        throw new AppError("Gig must have at least 1 package", 400)
    }

    if (data.packages.length > 3) {
        throw new AppError("Maximum 3 packages allowed", 400)
    }

    //  validate từng package
    data.packages.forEach((pkg, index) => {
        if (!pkg.title || !pkg.price || !pkg.deliveryDay) {
            throw new AppError(`Package at index ${index+1} is invalid`, 400)
        }
    })

    const minPrice = Array.isArray(data.packages) && data.packages.length > 0
        ? Math.min(...data.packages.map((p) => Number(p.price) || 0))
        : 0

    const gig = await Gig.create({
        title: data.title,
        description: data.description || "",
        img_url: data.img_url || "",
        img_public_id: data.img_public_id || "",
        category: {
            _id: category._id,
            name: category.name
        },
        freelancer: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar || ""
        },
        tags: Array.isArray(data.tags) ? data.tags : [],
        price: minPrice,
        rating: 0,
        reviewCount: 0
    })

    const gigPackages = await Package.insertMany(
        data.packages.map((pkg) => ({
            gigId: gig._id,
            title: pkg.title,
            description: pkg.description || "",
            price: pkg.price,
            deliveryDay: pkg.deliveryDay,
            revision: pkg.revision ?? 0
        }))
    )

    return {
        ...gig.toObject(),
        gig_packages: gigPackages.map((pkg) => pkg.toObject())
    }
}

const updateGigService = async(gigId, userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
        throw new AppError("Invalid Gig ID", 400, "INVALID_GIG_ID")
    }

    const gig = await Gig.findById(gigId)

    if(!gig){
        throw new AppError("Gig not found", 404, "GIG_NOT_FOUND")
    }

    if(String(gig.freelancer._id) !== String(userId)){
        throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const updateData = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.img_url !== undefined) updateData.img_url = data.img_url
    if (data.img_public_id !== undefined) updateData.img_public_id = data.img_public_id
    if (data.tags !== undefined) updateData.tags = Array.isArray(data.tags) ? data.tags : []

    if (data.categoryID) {
        if (!mongoose.Types.ObjectId.isValid(data.categoryID)) {
            throw new AppError("Invalid category ID", 400, "INVALID_CATEGORY_ID")
        }

        const category = await Category.findById(data.categoryID).select("name")

        if (!category) {
            throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND")
        }

        updateData.category = {
            _id: category._id,
            name: category.name
        }
    }

    // 1. Update MongoDB first
    const updateGig = await Gig.findByIdAndUpdate(gigId, updateData, {
        new: true,
        runValidators: true
    }).lean()

    // 2. Only after MongoDB update succeeds, clean up old Cloudinary asset
    if (data.img_url !== undefined && data.img_url !== gig.img_url) {
        const oldAsset = gig.img_public_id || gig.img_url
        if (oldAsset && (gig.img_public_id || (typeof gig.img_url === "string" && gig.img_url.includes("cloudinary.com")))) {
            deleteFromCloudinary(oldAsset).catch((err) => {
                console.warn("[Gig Service] Failed to delete old Cloudinary image:", err.message)
            })
        }
    }

    return updateGig
}

const deleteGigService = async(gigId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
        throw new AppError("Invalid Gig ID", 400)
    }

    const gig = await Gig.findById(gigId)

    if(!gig){
        throw new AppError("Gig not found", 404)
    }

    if(String(gig.freelancer._id) !== String(userId)){
        throw new AppError("Forbidden", 403);
    }

    // 1. Delete packages and gig from MongoDB first
    await Package.deleteMany({ gigId: gig._id })
    await Gig.findByIdAndDelete(gigId)

    // 2. Only after MongoDB deletion succeeds, delete Cloudinary asset
    const assetToDelete = gig.img_public_id || gig.img_url
    if (assetToDelete && (gig.img_public_id || (typeof gig.img_url === "string" && gig.img_url.includes("cloudinary.com")))) {
        deleteFromCloudinary(assetToDelete).catch((err) => {
            console.warn("[Gig Service] Failed to delete Cloudinary gig image on gig delete:", err.message)
        })
    }

    return gig.toObject()
}

module.exports = { getGigsService, getGigByIdService, createGigService, updateGigService, deleteGigService }