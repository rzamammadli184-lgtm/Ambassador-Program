const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-azestetik';

// Middleware to verify JWT
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token yoxdur' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch(err) {
        return res.status(401).json({ error: 'Token etibarsızdır' });
    }
};

// GET /api/referrals/me
router.get('/me', authenticate, async (req, res) => {
    try {
        // Fetch user's code from DB (in case they just registered and token is old, though it shouldn't happen)
        const currentUser = await User.findByPk(req.user.id);
        if (!currentUser) return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
        
        const myCode = currentUser.myReferralCode;
        
        // Find all users who used this code
        const referredUsers = await User.findAll({
            where: { referredBy: myCode },
            attributes: ['id', 'fullName', 'email', 'createdAt']
        });

        // Calculate "today" signups
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySignups = referredUsers.filter(u => new Date(u.createdAt) >= today).length;

        res.json({
            myReferralCode: myCode,
            totalReferrals: referredUsers.length,
            todaySignups: todaySignups,
            users: referredUsers
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server xətası' });
    }
});

module.exports = router;
