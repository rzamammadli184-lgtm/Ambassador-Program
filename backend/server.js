/**
 * AzEstetik Backend API Server
 * ════════════════════════════
 * Node.js + Express + Firebase Admin SDK
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Routes
const ambassadorRoutes = require('./routes/ambassadors');
const transactionRoutes = require('./routes/transactions');
const bonusRoutes = require('./routes/bonuses');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const eventRoutes = require('./routes/events');
const referralRoutes = require('./routes/referrals');

// Firebase init
const { initFirebase } = require('./services/firebase');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting - yüksək hədd: migration və normal istifadəni dəstəkləmək üçün
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 2000,
    message: { error: 'Çox sayda sorğu. Zəhmət olmasa bir az gözləyin.' },
    skip: (req) => req.method === 'GET' // GET sorğularına limit qoyma
});
app.use('/api/', limiter);

// Static files (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/ambassadors', ambassadorRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/bonuses', bonusRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/referrals', referralRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'AzEstetik Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint tapilmadi', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server xetasi:', err.stack);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Server xetasi' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ── Start ──────────────────────────────────────────────────
async function start() {
    // Firebase-i baslat
    const firebaseReady = initFirebase();
    console.log(firebaseReady ? '✅ Firebase Admin SDK qosuldu' : '⚠️ Firebase olmadan isleyir (lokal rejim)');

    // Database-i başlat
    const sequelize = require('./database');
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: false });
        console.log('✅ Database sinxronlaşdırıldı');
    } catch (err) {
        console.error('❌ Database xətası:', err.message);
        // Postgres olmadıqda alter:true ilə SQLite cəhdi
        try {
            await sequelize.sync({ alter: true });
            console.log('✅ Database (alter mode) sinxronlaşdırıldı');
        } catch (err2) {
            console.error('❌ Database tamamilə işləmir:', err2.message);
        }
    }

    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════╗
║   AzEstetik Backend API Server           ║
║   Port: ${PORT}                             ║
║   Mode: ${process.env.NODE_ENV || 'development'}                    ║
║   API:  http://localhost:${PORT}/api         ║
╚══════════════════════════════════════════╝
        `);
    });
}

start();

module.exports = app;
