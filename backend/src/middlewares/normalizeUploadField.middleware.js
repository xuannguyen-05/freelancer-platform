const { uploadBufferToCloudinary } = require("../services/cloudinary.service");

const normalizeUploadField = (field, folder = "workly/general") => {
  return async (req, res, next) => {
    try {
      if (req.file && req.file.buffer) {
        const uploadResult = await uploadBufferToCloudinary(req.file.buffer, { folder });
        req.body[field] = uploadResult.secure_url;
        
        // Track public_id based on target field
        if (field === "avatar") {
          req.body.avatar_public_id = uploadResult.public_id;
        } else if (field === "img_url" || field === "image") {
          req.body.img_public_id = uploadResult.public_id;
        }
        
        req.file.cloudinary = uploadResult;
        delete req.body.image;
      } else if (req.body.image && !req.body[field]) {
        req.body[field] = req.body.image;
        delete req.body.image;
      }

      // Parse JSON strings that are sent via multipart/form-data
      if (typeof req.body.preferences === "string") {
        try {
          req.body.preferences = JSON.parse(req.body.preferences);
        } catch (e) {}
      }
      if (typeof req.body.skillNames === "string") {
        try {
          req.body.skillNames = JSON.parse(req.body.skillNames);
        } catch (e) {}
      }
      if (typeof req.body.skills === "string") {
        try {
          req.body.skills = JSON.parse(req.body.skills);
        } catch (e) {}
      }
      if (typeof req.body.packages === "string") {
        try {
          req.body.packages = JSON.parse(req.body.packages);
        } catch (e) {}
      }
      if (typeof req.body.tags === "string") {
        try {
          req.body.tags = JSON.parse(req.body.tags);
        } catch (e) {}
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = normalizeUploadField;