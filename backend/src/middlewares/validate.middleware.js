const validate = (schema) => {
    return function(req, res, next){
        try {
            req.body = schema.parse(req.body)
            next()
        } catch (error) {
            const firstIssue = error.issues?.[0]
            const field = firstIssue?.path?.join('.')
            const rawMsg = firstIssue?.message || "Invalid input"
            const message = field ? `${field}: ${rawMsg}` : rawMsg

            return res.status(400).json({
                code: "VALIDATION_ERROR",
                message,
                errors: error.issues?.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            })
        }
    }
}

module.exports = {validate}