const {createCategoryService, 
        getCategoriesService, 
        getCategoryByIdService, 
        updateCategoryService, 
        deleteCategoryService} = require("../services/category.service")

const createCategory = async(req, res) => {
    try {
        const {categoryName, description} = req.body

        const category = await createCategoryService(categoryName, description)

        res.status(201).json({
            message: "Category created successfully",
            data: category
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getCategories = async(req, res) => {
    try {

        const categories = await getCategoriesService()

        res.status(200).json({
            message: "Get categories successfully",
            data: categories
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getCategoryById = async(req, res) => {
    try {
        const categoryId = req.params.id

        const category = await getCategoryByIdService(categoryId)

        res.status(200).json({
            message: "Get category successfully",
            data: category
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const updateCategory = async(req, res) => {
    try {

        const {categoryName, description} = req.body
        const categoryId = req.params.id

        const category = await updateCategoryService(categoryId, categoryName, description)

        res.status(200).json({
            message: "Update category successfully",
            data: category
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const deleteCategory = async(req, res) => {
    try {
        const categoryId = req.params.id

        const category = await deleteCategoryService(categoryId)

        res.status(200).json({
            message: "Delete category successfully",
            data: null
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


module.exports = {createCategory, getCategories, getCategoryById, updateCategory, deleteCategory}