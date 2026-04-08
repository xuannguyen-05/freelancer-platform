const express = require("express");
const {createFreelancer, getFreelancerById, getMyFreelancer, updateMyFreelancer} = require("../controllers/freelancer.controller")
const { authMiddleware } = require("../middlewares/auth.middleware.js")
const {createFreelancerSchema, updateFreelancerSchema} = require("../schemas/freelancer.schema.js")
const {validate} = require("../middlewares/validate.middleware")


const router = express.Router();

router.post("/", authMiddleware, validate(createFreelancerSchema), createFreelancer)
router.get("/me", authMiddleware, getMyFreelancer)
router.patch("/me", authMiddleware, validate(updateFreelancerSchema), updateMyFreelancer)

router.get("/:id", getFreelancerById)



module.exports = router

// API:
// POST /freelancers
// GET /freelancers/:id
// GET /freelancers/me
// PATCH /freelancers/me

// (GET /freelancers)