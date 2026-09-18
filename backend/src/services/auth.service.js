const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/user")
const refreshToken = require("../models/refreshToken")
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

    const accessToken = jwt.sign(
        {
            userID: String(user._id),
            role: user.role
        },
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    const refreshTokenJWT = jwt.sign(
        { userID: String(user._id) },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    )

    await refreshToken.create({
        token: refreshTokenJWT,
        userId: user._id,
        expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        )
    })

    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshTokenJWT
    }
}

const refreshTokenService = async(token) => {
    if(!token){
        throw new AppError("No refresh token", 401)
    }

    let payload
    try {
        payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    } catch (err) {
        throw new AppError("Invalid refresh token", 401)
    }

    const storedToken = await refreshToken.findOne({ token })

    if (!storedToken) {
        throw new AppError("Refresh token not found", 401)
    }

    if (storedToken.revoked) {
        throw new AppError("Refresh token revoked", 401)
    }

    if (storedToken.expiresAt && storedToken.expiresAt < new Date()) {
        throw new AppError("Refresh token expired", 401)
    }

    if (!payload.userID || String(storedToken.userId) !== String(payload.userID)) {
        throw new AppError("Invalid refresh token", 401)
    }

    const user = await User.findById(payload.userID)

    if (!user || !user.isActive) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND")
    }

    const newAccessToken = jwt.sign(
        { 
            userID: String(user._id),
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return {
        accessToken: newAccessToken
    }
}

const logoutService = async (token) => {
    if (!token) {
        throw new AppError("No refresh token", 400)
    }

    await refreshToken.updateOne(
        { token },
        { $set: { revoked: true } }
    )

    return { message: "Logged out successfully" };
};

module.exports = {registerService, loginService, refreshTokenService, logoutService}