const mongoose = require("mongoose")
const Category = require("../models/category")
const AppError = require("../utils/AppError")

const createCategoryService = async(categoryName, description) => {
    const normalizedName = String(categoryName).trim()
    const existing = await Category.findOne({ name: normalizedName })
    
    if(existing){
        throw new AppError("Category already exists", 400);
        
    }
    
    const category = await Category.create({
        name: normalizedName,
        description: description || ""
    })

    return category.toObject()
}

const getCategoriesService = async() => {
    const categories = await Category.find({}).sort({ name: 1 }).lean()

    return categories
}

const getCategoryByIdService = async(categoryId) => {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new AppError("Invalid Category ID", 400)
    }

    const category = await Category.findById(categoryId).lean()

    if (!category){
        throw new AppError("Category Not Found", 404);
    }

    return category
}

const updateCategoryService = async(categoryId, categoryName, description) => {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new AppError("Invalid Category ID", 400)
    }

    const category = await Category.findById(categoryId)

    if (!category){
        throw new AppError("Category Not Found", 404);
    }

    // 🔥 check duplicate
    if (categoryName) {
        const existing = await Category.findOne({ name: String(categoryName).trim() })

        if (existing && String(existing._id) !== String(categoryId)) {
            throw new AppError("Category already exists", 400)
        }
    }

    if (categoryName !== undefined) category.name = String(categoryName).trim()
    if (description !== undefined) category.description = description

    await category.save()

    return category.toObject()
}

const deleteCategoryService = async(categoryId) => {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw new AppError("Invalid Category ID", 400)
    }

    const category = await Category.findById(categoryId)

    if (!category){
        throw new AppError("Category Not Found", 404);
    }

    await Category.findByIdAndDelete(categoryId)

    return category.toObject()
}




module.exports = {createCategoryService, getCategoriesService, getCategoryByIdService, updateCategoryService, deleteCategoryService}