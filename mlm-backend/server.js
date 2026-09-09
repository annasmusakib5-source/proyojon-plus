const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const packageRoutes = require('./routes/packageRoutes');
const walletRoutes = require('./routes/walletRoutes');
const networkRoutes = require('./routes/networkRoutes');
const clubRoutes = require('./routes/clubRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dealerRoutes = require('./routes/dealerRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { getPublicSettings } = require('./controllers/settingsController');

const { startGoldDailyDripJob } = require('./jobs/goldDailyROI.job');
const { startGoldDueAccountJob } = require('./jobs/goldDueAccount.job');
const { startPackageExpiryJob } = require('./jobs/packageExpiry.job');
const { startSalaryClubPromotionJob } = require('./jobs/salaryClubPromotion.job');

const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Update later if needed
    credentials: true // Required for HttpOnly cookies
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api', authRoutes); // authRoutes internally defines /auth/register, /auth/login, etc.
app.use('/api', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/withdraw', withdrawalRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dealer', dealerRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/upload', uploadRoutes);
app.get('/api/settings', getPublicSettings);

app.get('/', (req, res) => {
    res.json({ message: "MLM E-commerce & Investment Platform API is running successfully!" });
});

// Initialize Cron Jobs
startGoldDailyDripJob();
startGoldDueAccountJob();
startPackageExpiryJob();
startSalaryClubPromotionJob();

// Global Error Handler (Must be last)
app.use(errorHandler);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});