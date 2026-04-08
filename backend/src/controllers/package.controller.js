const {createPackageService, 
        getPackagesByGigIdService, 
        updatePackageService, 
        deletePackageService} = require("../services/package.service")
const formatPackage = require("../utils/formatPackage")

const createPackage = async(req, res) => {
    try {
        const userId = req.user.userID
        const gigId = req.params.id
        const pkg = await createPackageService(gigId, userId, req.body)

        res.status(201).json({
            message: "Package created successfully",
            data: formatPackage(pkg)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const getPackagesByGigId = async(req, res) => {
    try {
        const gigId = req.params.id
        const packages  = await getPackagesByGigIdService(gigId)

        res.status(200).json({
            message: "Get packages successfully",
            data: packages.map(formatPackage)
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const updatePackage = async(req, res) => {
    try {
        const userId = req.user.userID
        const packageId = req.params.id

        const pkg = await updatePackageService(packageId, userId, req.body)

        res.status(200).json({
            message: "Package updated successfully",
            data: formatPackage(pkg)
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const deletePackage = async(req, res) => {
    try {
        const userId = req.user.userID
        const packageId = req.params.id

        const pkg = await deletePackageService(packageId, userId)

        res.status(200).json({
            message: "Package deleted successfully",
            data: null
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}


module.exports = {createPackage, getPackagesByGigId, updatePackage, deletePackage}