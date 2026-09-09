const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticateUser } = require('../middleware/auth');
const {
    uploadSingleImage,
    uploadMultipleImages,
    deleteImage
} = require('../controllers/uploadController');

// POST /api/upload - Single image upload (accepts multipart/form-data with field name 'image' or 'file', or JSON body { image: "base64" })
router.post('/', authenticateUser, upload.single('image'), uploadSingleImage);

// POST /api/upload/file - Alternative field name 'file'
router.post('/file', authenticateUser, upload.single('file'), uploadSingleImage);

// POST /api/upload/multiple - Multiple images upload (up to 10 files)
router.post('/multiple', authenticateUser, upload.array('images', 10), uploadMultipleImages);

// DELETE /api/upload - Delete image by public_id
router.delete('/', authenticateUser, deleteImage);

module.exports = router;
