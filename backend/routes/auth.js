const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-azestetik';

// Helper: Generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /register
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, region, referredBy } = req.body;
        
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'Bütün xanaları doldurun' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ error: 'Bu e-poçt artıq qeydiyyatdan keçib' });
            }
            // User exists but unverified, allow re-registration
            await existingUser.destroy();
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        // Generate unique referral code for this user
        const refCode = 'AZE_' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await User.create({ fullName, email, passwordHash, region: region || null, isVerified: false, referredBy: referredBy || null, myReferralCode: refCode });

        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await Otp.destroy({ where: { email } }); // Clear old OTPs
        await Otp.create({ email, code: otpCode, expiresAt });

        const emailSent = await sendOtpEmail(email, otpCode, false);
        if (!emailSent) {
            return res.status(500).json({ error: 'E-poçt göndərilərkən xəta baş verdi' });
        }

        res.json({ message: 'OTP göndərildi', email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server xətası baş verdi' });
    }
});

// POST /verify-registration
router.post('/verify-registration', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await Otp.findOne({ where: { email, code: otp } });
        if (!otpRecord) {
            return res.status(400).json({ error: 'OTP kodu yanlışdır' });
        }
        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ error: 'OTP kodun vaxtı bitib' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
        }

        user.isVerified = true;
        await user.save();
        await Otp.destroy({ where: { email } }); // Consume OTP

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, myReferralCode: user.myReferralCode }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ message: 'Hesab aktivləşdirildi', token, user: { fullName: user.fullName, email: user.email, myReferralCode: user.myReferralCode } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server xətası baş verdi' });
    }
});

// POST /login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'E-poçt və ya şifrə yanlışdır' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'E-poçt və ya şifrə yanlışdır' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Zəhmət olmasa, hesabınızı e-poçt vasitəsilə təsdiqləyin', requiresVerification: true });
        }

        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await Otp.destroy({ where: { email } });
        await Otp.create({ email, code: otpCode, expiresAt });

        const emailSent = await sendOtpEmail(email, otpCode, true);
        if (!emailSent) {
            return res.status(500).json({ error: 'E-poçt göndərilərkən xəta baş verdi' });
        }

        res.json({ message: 'OTP göndərildi, təsdiq gözlənilir', requireOtp: true, email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server xətası baş verdi' });
    }
});

// POST /verify-login
router.post('/verify-login', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await Otp.findOne({ where: { email, code: otp } });
        if (!otpRecord) {
            return res.status(400).json({ error: 'OTP kodu yanlışdır' });
        }
        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ error: 'OTP kodun vaxtı bitib' });
        }

        const user = await User.findOne({ where: { email } });
        await Otp.destroy({ where: { email } });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, myReferralCode: user.myReferralCode }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ message: 'Giriş uğurlu oldu', token, user: { fullName: user.fullName, email: user.email, myReferralCode: user.myReferralCode } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server xətası baş verdi' });
    }
});

// POST /resend-otp
router.post('/resend-otp', async (req, res) => {
    try {
        const { email, mode } = req.body;
        if (!email) return res.status(400).json({ error: 'Email tələb olunur' });

        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await Otp.destroy({ where: { email } });
        await Otp.create({ email, code: otpCode, expiresAt });

        const isLogin = mode === 'login';
        await sendOtpEmail(email, otpCode, isLogin);

        res.json({ message: 'Yeni OTP göndərildi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server xətası baş verdi' });
    }
});

// GET /me (verify token)
router.get('/me', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token yoxdur' });
    }
    try {
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: decoded });
    } catch(err) {
        res.status(401).json({ error: 'Token etibarsızdır' });
    }
});

module.exports = router;
