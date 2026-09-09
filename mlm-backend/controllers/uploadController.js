const { cloudinary, isConfigured } = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Helper to upload buffer to Cloudinary using upload_stream
 */
const uploadBufferToCloudinary = (buffer, folder = 'proyojon_plus') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' } // Auto optimize WebP & compression
                ]
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        Readable.from(buffer).pipe(stream);
    });
};

/**
 * Upload single image
 * POST /api/upload
 */
const uploadSingleImage = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(400).json({
                success: false,
                message: "Cloudinary credentials are not configured in .env. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
            });
        }

        const folder = req.body.folder || 'proyojon_plus';

        // Check if file is uploaded via multipart/form-data
        if (req.file) {
            const result = await uploadBufferToCloudinary(req.file.buffer, folder);
            return res.json({
                success: true,
                message: "Image uploaded successfully to Cloudinary",
                data: {
                    url: result.secure_url,
                    public_id: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    size: result.bytes
                }
            });
        }

        // Check if image is sent as base64 string or image URL
        if (req.body.image) {
            const result = await cloudinary.uploader.upload(req.body.image, {
                folder: folder,
                resource_type: 'auto',
                transformation: [{ quality: 'auto', fetch_format: 'auto' }]
            });

            return res.json({
                success: true,
                message: "Image uploaded successfully to Cloudinary",
                data: {
                    url: result.secure_url,
                    public_id: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    size: result.bytes
                }
            });
        }

        return res.status(400).json({
            success: false,
            message: "No image file or base64 image data provided"
        });

    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload image to Cloudinary"
        });
    }
};

/**
 * Upload multiple images
 * POST /api/upload/multiple
 */
const uploadMultipleImages = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(400).json({
                success: false,
                message: "Cloudinary credentials are not configured in .env."
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });
        }

        const folder = req.body.folder || 'proyojon_plus';

        const uploadPromises = req.files.map(file => uploadBufferToCloudinary(file.buffer, folder));
        const results = await Promise.all(uploadPromises);

        const uploadedImages = results.map(result => ({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes
        }));

        return res.json({
            success: true,
            message: `${uploadedImages.length} images uploaded successfully`,
            data: uploadedImages
        });

    } catch (error) {
        console.error("Cloudinary multiple upload error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload images"
        });
    }
};

/**
 * Delete image from Cloudinary
 * DELETE /api/upload
 */
const deleteImage = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(400).json({
                success: false,
                message: "Cloudinary credentials are not configured."
            });
        }

        const { public_id } = req.body;
        if (!public_id) {
            return res.status(400).json({
                success: false,
                message: "public_id is required to delete image"
            });
        }

        const result = await cloudinary.uploader.destroy(public_id);

        return res.json({
            success: true,
            message: "Image deleted successfully",
            result
        });

    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete image"
        });
    }
};

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    deleteImage
};
