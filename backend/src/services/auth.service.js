const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/user")
const AppError = require("../utils/AppError")

const registerService  = async(data) => {
    const {name, email, password} = data
    const normalizedEmail = String(email).trim().toLowerCase()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser){
        throw new AppError("Email already exists", 409)
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "buyer"
    })

    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role
    }
}

const loginService = async(data) => {
    const {email, password} = data
    const normalizedEmail = String(email).trim().toLowerCase()

    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
        throw new AppError("Invalid email or password", 400)
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new AppError("Invalid email or password", 400)
    }

    const token = jwt.sign(
        {
            userID: String(user._id),
            role: user.role
        },
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        token
    }
}

module.exports = {registerService, loginService}