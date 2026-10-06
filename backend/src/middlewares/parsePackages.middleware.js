const parsePackages = (req, res, next) => {
  try {
    if (req.body.packages && typeof req.body.packages === 'string') {
      req.body.packages = JSON.parse(req.body.packages)
    }
    next()
  } catch (error) {
    res.status(400).json({
      message: "packages must be valid JSON"
    })
  }
}

module.exports = parsePackages