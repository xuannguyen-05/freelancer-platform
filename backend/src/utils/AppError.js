class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message)
        this.statusCode = statusCode
        this.code = code
    }
}

module.exports = AppError