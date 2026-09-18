const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        unique: true,
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    expiresAt: Date,

    createdAt: {
        type: Date,
        default: Date.now
    },

    revoked: {
        type: Boolean,
        default: false
    }
})

refreshTokenSchema.index({userId: 1, revoked: 1})
refreshTokenSchema.index(
    {expiresAt: 1},
    {expireAfterSeconds: 0}
)

const refreshToken = mongoose.model("refreshToken", refreshTokenSchema)

module.exports = refreshToken
