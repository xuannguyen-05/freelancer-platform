const express = require("express");

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../controllers/category.controller")
const { authMiddleware } = require("../middlewares/auth.middleware.js")
const { roleMiddleware } = require("../middlewares/role.middleware");
const {validate} = require("../middlewares/validate.middleware")
const {createCategorySchema, updateCategorySchema} = require("../schemas/category.schema.js")

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin"]), validate(createCategorySchema), createCategory)
router.get("/", getCategories)
router.get("/:id", getCategoryById)
router.patch("/:id", authMiddleware, roleMiddleware(["admin"]), validate(updateCategorySchema), updateCategory)
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteCategory)




module.exports = router
