const mongoose = require("mongoose")
const Gig = require("../models/gig")
const Package = require("../models/package")
const AppError = require("../utils/AppError")

const createPackageService = async (gigId, userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
        throw new AppError("Invalid Gig ID", 400)
    }

    const gig = await Gig.findById(gigId)

    if (!gig) {
        throw new AppError("Gig Not Found", 404)
    }

    if (String(gig.freelancer._id) !== String(userId)) {
        throw new AppError("Forbidden", 403)
    }

    const count = await Package.countDocuments({ gigId })

    if (count >= 3) {
        throw new AppError("Maximum 3 packages allowed", 400)
    }

    const pkg = await Package.create({
        title: data.title,
        description: data.description || "",
        price: data.price,
        deliveryDay: data.deliveryDay,
        revision: data.revision ?? 0,
        gigId
    })

    return pkg.toObject()
}

const getPackagesByGigIdService = async(gigId) => {
    if (!mongoose.Types.ObjectId.isValid(gigId)) {
        throw new AppError("Invalid Gig ID", 400)
    }

    const gig = await Gig.findById(gigId)

    if (!gig) {
        throw new AppError("Gig not found", 404)
    }

    const packages = await Package.find({ gigId }).sort({ price: 1 }).lean()
    
    return packages
}

const updatePackageService = async(packageId, userId, data) => {
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
        throw new AppError("Invalid Package ID", 400)
    }

    const pkg = await Package.findById(packageId)

    if (!pkg){
        throw new AppError("Package Not Found", 404)
    }

    const gig = await Gig.findById(pkg.gigId)

    if (!gig) {
        throw new AppError("Gig Not Found", 404)
    }

    if (String(gig.freelancer._id) !== String(userId)) {
        throw new AppError("Forbidden", 403)
    }

    const updateData = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.price !== undefined) updateData.price = data.price
    if (data.deliveryDay !== undefined) updateData.deliveryDay = data.deliveryDay
    if (data.revision !== undefined) updateData.revision = data.revision

    const updated = await Package.findByIdAndUpdate(packageId, updateData, {
        new: true,
        runValidators: true
    }).lean()

    return updated
}

const deletePackageService = async(packageId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
        throw new AppError("Invalid Package ID", 400)
    }

    const pkg = await Package.findById(packageId)

    if (!pkg){
        throw new AppError("Package Not Found", 404)
    }

    const gig = await Gig.findById(pkg.gigId)

    if (!gig) {
        throw new AppError("Gig Not Found", 404)
    }

    if (String(gig.freelancer._id) !== String(userId)) {
        throw new AppError("Forbidden", 403)
    }

    const count = await Package.countDocuments({ gigId: pkg.gigId })

    if (count <= 1) {
        throw new AppError("Gig must have at least 1 package", 400)
    }

    await Package.findByIdAndDelete(packageId)

    return pkg.toObject()
}

module.exports = { createPackageService, getPackagesByGigIdService, updatePackageService, deletePackageService }