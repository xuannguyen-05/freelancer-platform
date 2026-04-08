const express = require("express");

const {
    createOrder,
    getMyOrders,
    getFreelancerOrders,
    getOrderById,
    cancelOrder
} = require("../controllers/order.controller");

const { authMiddleware } = require("../middlewares/auth.middleware");
const { roleMiddleware } = require("../middlewares/role.middleware");
const { createOrderSchema } = require("../schemas/order.schema")
const { validate } = require("../middlewares/validate.middleware")

const router = express.Router();


router.post("/", authMiddleware, roleMiddleware(["buyer"]), validate(createOrderSchema), createOrder)

router.get("/my", authMiddleware, roleMiddleware(["buyer"]), getMyOrders)

router.get("/freelancer", authMiddleware, roleMiddleware(["freelancer"]), getFreelancerOrders)

router.get("/:id", authMiddleware, getOrderById)

router.patch("/:id/cancel", authMiddleware, cancelOrder)


module.exports = router



