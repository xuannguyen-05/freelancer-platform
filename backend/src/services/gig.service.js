const mongoose = require("mongoose")
const Gig = require("../models/gig")
const Package = require("../models/package")
const User = require("../models/user")
const Category = require("../models/category")
const AppError = require("../utils/AppError")

const getGigsService = async (page, limit, categoryID, search) => {
    const skip = (page - 1) * limit
    const where = {}

    if (categoryID) {
        if (!mongoose.Types.ObjectId.isValid(categoryID)) {
            throw new AppError("Invalid category ID", 400)
        }
        where["category._id"] = categoryID
    }

    if (search) {
        where.title = { $regex: search, $options: "i" }
    }

    const [gigs, total] = await Promise.all([
        Gig.find(where)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Gig.countDocuments(where)
    ])

    return {
        page,
        limit,
        total,
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

    const gigPackages = await Package.find({ gigId: gig._id }).sort({ price: 1 }).lean()

    return {
        ...gig,
        gig_packages: gigPackages
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

    const gig = await Gig.create({
        title: data.title,
        description: data.description || "",
        img_url: data.img_url || "",
        category: {
            _id: category._id,
            name: category.name
        },
        freelancer: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar || ""
        }
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
        throw new AppError("Invalid Gig ID", 400)
    }

    const gig = await Gig.findById(gigId)

    if(!gig){
        throw new AppError("Gig not found", 404)
    }

    if(String(gig.freelancer._id) !== String(userId)){
        throw new AppError("Forbidden", 403);
    }

    const updateData = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.img_url !== undefined) updateData.image = data.img_url

    if (data.categoryID) {
        if (!mongoose.Types.ObjectId.isValid(data.categoryID)) {
            throw new AppError("Invalid category ID", 400)
        }

        const category = await Category.findById(data.categoryID).select("name")

        if (!category) {
            throw new AppError("Category not found", 404)
        }

        updateData.category = {
            _id: category._id,
            name: category.name
        }
    }

    const updateGig = await Gig.findByIdAndUpdate(gigId, updateData, {
        new: true,
        runValidators: true
    }).lean()

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

    await Package.deleteMany({ gigId: gig._id })
    await Gig.findByIdAndDelete(gigId)

    return gig.toObject()
}

module.exports = { getGigsService, getGigByIdService, createGigService, updateGigService, deleteGigService }