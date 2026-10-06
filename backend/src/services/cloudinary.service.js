const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");
const AppError = require("../utils/AppError");

/**
 * Upload an in-memory file buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer - In-memory file buffer from Multer
 * @param {Object} options - Cloudinary upload options (e.g. folder, transformation)
 * @returns {Promise<{ url: string, secure_url: string, public_id: string, format: string, bytes: number, width: number, height: number }>}
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return reject(new AppError("Invalid file buffer for upload", 400, "INVALID_FILE_BUFFER"));
    }

    const uploadOptions = {
      resource_type: "image",
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Service] Upload error:", error);
          return reject(new AppError(`Image upload failed: ${error.message}`, 500, "CLOUDINARY_UPLOAD_ERROR"));
        }
        resolve({
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height
        });
      }
    );

    // Pipe the buffer into Cloudinary uploadStream via Node standard Readable stream
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Extract public_id from Cloudinary URL if a full URL was stored
 * e.g., https://res.cloudinary.com/cloud_name/image/upload/v1234567/workly/avatars/abc123xyz.png
 * => workly/avatars/abc123xyz
 * @param {string} urlOrId
 * @returns {string|null}
 */
const extractPublicId = (urlOrId) => {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  // If it does not contain cloudinary.com, assume it's already a public_id
  if (!urlOrId.includes("cloudinary.com")) {
    return urlOrId.trim();
  }

  // Regex to extract path after /upload/ (and optional version /v12345/) up to the file extension
  const match = urlOrId.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
  return match ? match[1] : null;
};

/**
 * Delete an asset from Cloudinary safely
 * @param {string} publicIdOrUrl
 * @returns {Promise<{ result: string }>}
 */
const deleteFromCloudinary = async (publicIdOrUrl) => {
  try {
    const publicId = extractPublicId(publicIdOrUrl);
    if (!publicId) {
      return { result: "not_found" };
    }

    const res = await cloudinary.uploader.destroy(publicId, {
      invalidate: true
    });
    console.log(`[Cloudinary Service] Deleted asset ${publicId}:`, res.result);
    return res;
  } catch (err) {
    console.warn(`[Cloudinary Service] Warning: Failed to delete asset ${publicIdOrUrl}:`, err.message);
    return { result: "error", message: err.message };
  }
};

module.exports = {
  uploadBufferToCloudinary,
  extractPublicId,
  deleteFromCloudinary
};
