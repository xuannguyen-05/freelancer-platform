const validate = (schema) => {
    return function(req, res, next){
        try {
            req.body = schema.parse(req.body)
            next()
        } catch (error) {
            return res.status(400).json({
                message: error.issues?.[0]?.message || "Invalid input"
            })
        }
    }
}

module.exports = {validate}