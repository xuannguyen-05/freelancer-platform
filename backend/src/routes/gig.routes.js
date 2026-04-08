const express = require("express")

const {getGigs, getGigById, createGig, updateGig, deleteGig} = require("../controllers/gig.controller")
const {createPackage, getPackagesByGigId} = require("../controllers/package.controller.js")

const {createGigSchema, updateGigSchema} = require("../schemas/gig.schema.js")
const {createPackageSchema} = require("../schemas/package.schema.js")

const {validate} = require("../middlewares/validate.middleware")
const { authMiddleware } = require("../middlewares/auth.middleware.js")
const {roleMiddleware} = require("../middlewares/role.middleware.js")
const upload = require("../middlewares/upload.middleware")
const normalizeUploadField = require("../middlewares/normalizeUploadField.middleware.js")
const parsePackages = require("../middlewares/parsePackages.middleware")

const router = express.Router();


router.get("/", getGigs)
router.get("/:id", getGigById)

router.post("/", 
            authMiddleware, 
            roleMiddleware(["freelancer"]), 
            upload.single("image"),
            normalizeUploadField("img_url"),
            parsePackages, 
            validate(createGigSchema), 
            createGig)
router.patch("/:id", 
            authMiddleware, 
            roleMiddleware(["freelancer"]), 
            upload.single("image"),
            normalizeUploadField("img_url"),
            parsePackages, 
            validate(updateGigSchema), 
            updateGig)
router.delete("/:id", authMiddleware, roleMiddleware(["freelancer"]), deleteGig)

router.post("/:id/packages", 
            authMiddleware, 
            roleMiddleware(["freelancer"]), 
            validate(createPackageSchema), 
            createPackage)
router.get("/:id/packages", getPackagesByGigId)



module.exports = router





// api:
// PUBLIC
// GET /gigs Trang chủ + filter + pagination
// GET /gigs/:id

// FREELANCER
// POST /gigs
// PATCH /gigs/:id
// DELETE /gigs/:id

// PACKAGES
// POST /gigs/:id/packages
// GET /gigs/:id/packages

// PATCH /packages/:id
// DELETE /packages/:id