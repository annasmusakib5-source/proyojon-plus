const multer = require('multer');

// Memory storage keeps file buffer in memory so we can stream it directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Check if the uploaded file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB maximum limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
