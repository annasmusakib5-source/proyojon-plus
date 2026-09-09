const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeAdmin } = require('../middleware/auth');
const { 
    resetUserPassword, 
    getUserAuditLog,
    getAllUsers,
    getUserDetails,
    banUser,
    unbanUser,
    updateUserStatus,
    getWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    manualBalanceAdjustment,
    configDealer,
    getDealers
} = require('../controllers/adminController');
const { previewDistribution, triggerDistribution, getDistributionHistory } = require('../controllers/adminDistributionController');
const {
    getSalesReport,
    getWithdrawalsReport,
    getClubsReport,
    getUsersReport,
    getDueAccountsReport
} = require('../controllers/adminReportController');
const {
    adminGetSettings,
    adminUpdateSettings
} = require('../controllers/settingsController');
const {
    adminGetAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const {
    adminGetAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');
const {
    adminGetDealerApplications,
    approveDealerApplication,
    rejectDealerApplication
} = require('../controllers/dealerController');
const {
    adminGetAllNotices,
    createNotice,
    updateNotice,
    deleteNotice,
    adminGetAllGalleryImages,
    createGalleryImage,
    deleteGalleryImage
} = require('../controllers/noticeController');

// ========================
// System Reports
// ========================

router.get('/reports/sales', authenticateUser, authorizeAdmin, getSalesReport);
router.get('/reports/withdrawals', authenticateUser, authorizeAdmin, getWithdrawalsReport);
router.get('/reports/clubs', authenticateUser, authorizeAdmin, getClubsReport);
router.get('/reports/users', authenticateUser, authorizeAdmin, getUsersReport);
router.get('/reports/due-accounts', authenticateUser, authorizeAdmin, getDueAccountsReport);

// ========================
// Settings
// ========================

// GET /api/admin/settings
router.get('/settings', authenticateUser, authorizeAdmin, adminGetSettings);

// PUT /api/admin/settings
router.put('/settings', authenticateUser, authorizeAdmin, adminUpdateSettings);

// ========================
// Manual Balance Adjustments
// ========================

// POST /api/admin/adjustments
router.post('/adjustments', authenticateUser, authorizeAdmin, manualBalanceAdjustment);

// ========================
// Dealer Management
// ========================

// GET /api/admin/dealers
router.get('/dealers', authenticateUser, authorizeAdmin, getDealers);

// PUT /api/admin/dealers/:userId/config
router.put('/dealers/:userId/config', authenticateUser, authorizeAdmin, configDealer);

// ========================
// User Management
// ========================

// GET /api/admin/users
router.get('/users', authenticateUser, authorizeAdmin, getAllUsers);

// GET /api/admin/users/:id
router.get('/users/:id', authenticateUser, authorizeAdmin, getUserDetails);

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', authenticateUser, authorizeAdmin, banUser);

// PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', authenticateUser, authorizeAdmin, unbanUser);

// PUT /api/admin/users/:id/status  ← Generic activate/deactivate/ban
router.put('/users/:id/status', authenticateUser, authorizeAdmin, updateUserStatus);

// PUT /api/admin/users/:id/reset-password
// Admin manually resets a user's password (PRD §1)
router.put('/users/:id/reset-password', authenticateUser, authorizeAdmin, resetUserPassword);

// GET /api/admin/users/:id/audit
// Fetch user's complete activity log (PRD §5)
router.get('/users/:id/audit', authenticateUser, authorizeAdmin, getUserAuditLog);

// ========================
// Withdrawal Management
// ========================

// GET /api/admin/withdrawals
router.get('/withdrawals', authenticateUser, authorizeAdmin, getWithdrawals);

// PUT /api/admin/withdrawals/:id/approve
router.put('/withdrawals/:id/approve', authenticateUser, authorizeAdmin, approveWithdrawal);

// PUT /api/admin/withdrawals/:id/reject
router.put('/withdrawals/:id/reject', authenticateUser, authorizeAdmin, rejectWithdrawal);

// ========================
// Club Distribution System
// ========================

// GET /api/admin/distribution/preview
router.get('/distribution/preview', authenticateUser, authorizeAdmin, previewDistribution);

// POST /api/admin/distribution/trigger
router.post('/distribution/trigger', authenticateUser, authorizeAdmin, triggerDistribution);

// GET /api/admin/distribution/history
router.get('/distribution/history', authenticateUser, authorizeAdmin, getDistributionHistory);

// ========================
// E-Commerce: Product Management
// ========================

// GET /api/admin/products
router.get('/products', authenticateUser, authorizeAdmin, adminGetAllProducts);

// POST /api/admin/products
router.post('/products', authenticateUser, authorizeAdmin, createProduct);

// PUT /api/admin/products/:id
router.put('/products/:id', authenticateUser, authorizeAdmin, updateProduct);

// DELETE /api/admin/products/:id
router.delete('/products/:id', authenticateUser, authorizeAdmin, deleteProduct);

// ========================
// E-Commerce: Order Management
// ========================

// GET /api/admin/orders
router.get('/orders', authenticateUser, authorizeAdmin, adminGetAllOrders);

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', authenticateUser, authorizeAdmin, updateOrderStatus);

// ========================
// E-Commerce: Dealer Application Management
// ========================

// GET /api/admin/dealer-applications
router.get('/dealer-applications', authenticateUser, authorizeAdmin, adminGetDealerApplications);

// PUT /api/admin/dealer-applications/:id/approve
router.put('/dealer-applications/:id/approve', authenticateUser, authorizeAdmin, approveDealerApplication);

// PUT /api/admin/dealer-applications/:id/reject
router.put('/dealer-applications/:id/reject', authenticateUser, authorizeAdmin, rejectDealerApplication);

// ========================
// Notice & Gallery Management
// ========================

// GET /api/admin/notices
router.get('/notices', authenticateUser, authorizeAdmin, adminGetAllNotices);

// POST /api/admin/notices
router.post('/notices', authenticateUser, authorizeAdmin, createNotice);

// PUT /api/admin/notices/:id
router.put('/notices/:id', authenticateUser, authorizeAdmin, updateNotice);

// DELETE /api/admin/notices/:id
router.delete('/notices/:id', authenticateUser, authorizeAdmin, deleteNotice);

// GET /api/admin/gallery
router.get('/gallery', authenticateUser, authorizeAdmin, adminGetAllGalleryImages);

// POST /api/admin/gallery
router.post('/gallery', authenticateUser, authorizeAdmin, createGalleryImage);

// DELETE /api/admin/gallery/:id
router.delete('/gallery/:id', authenticateUser, authorizeAdmin, deleteGalleryImage);

module.exports = router;
