const {registerService, loginService} = require("../services/auth.service")

const register  = async(req, res) => {
    try {
        const user = await registerService(req.body)
        res.status(201).json({
            message: "Register success", 
            data: user
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const login = async(req, res) => {
    try {
        const user = await loginService(req.body)
        res.status(201).json({
            message: "Login success", 
            data: user
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        })
    }
}

const me = async (req, res) => {
    res.json({
        user: req.user
    })
}

module.exports = {register, login, me}