const express = require("express");
const { authMiddleware } = require("../middlewares/auth.middleware.js")
const {roleMiddleware} = require("../middlewares/role.middleware.js");
const {createReview, getReviewsByFreelancer} = require("../controllers/review.controller");
const {createReviewSchema} = require("../schemas/review.schema")
const {validate} = require("../middlewares/validate.middleware")

const router = express.Router();


router.post("/", authMiddleware, roleMiddleware(["buyer"]), validate(createReviewSchema), createReview)
router.get("/:freelancerId", getReviewsByFreelancer)


module.exports = router







// api
// POST /reviews
// GET  /reviews/:freelancerId