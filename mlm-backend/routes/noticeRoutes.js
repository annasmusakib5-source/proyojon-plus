const express = require('express');
const router = express.Router();
const {
    getActiveNotices,
    getTickerNotices,
    getGalleryImages
} = require('../controllers/noticeController');

// ========================
// Public Notice & Gallery Routes
// ========================

// GET /api/notices - Active notices
router.get('/', getActiveNotices);

// GET /api/notices/ticker - Ticker notices for top bar
router.get('/ticker', getTickerNotices);

// GET /api/gallery - Gallery images
router.get('/gallery', getGalleryImages);

module.exports = router;
