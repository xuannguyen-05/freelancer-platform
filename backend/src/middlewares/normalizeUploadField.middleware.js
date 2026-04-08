const normalizeUploadField = (field) => {
  return (req, res, next) => {
    if (req.file) {
      req.body[field] = "/uploads/" + req.file.filename;
    }
    next();
  };
};

module.exports = normalizeUploadField