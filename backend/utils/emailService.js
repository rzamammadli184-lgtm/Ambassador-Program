const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOtpEmail = async (toEmail, otpCode, isLogin = false) => {
    const subject = isLogin ? 'AzEstetik - Giriş Təsdiq Kodu' : 'AzEstetik - Qeydiyyat Təsdiq Kodu';
    const htmlContent = `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center;">
            <img src="https://raw.githubusercontent.com/username/repo/main/assets/azestetik_logo.png" alt="AzEstetik Logo" style="width: 150px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 10px;">OTP Doğrulama Kodu</h2>
            <p style="color: #64748b; font-size: 16px; margin-bottom: 30px;">
                Hörmətli istifadəçi, ${isLogin ? 'sistemə giriş etmək' : 'qeydiyyatınızı tamamlamaq'} üçün aşağıdakı 6-rəqəmli kodu daxil edin:
            </p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #00A651; margin-bottom: 30px;">
                ${otpCode}
            </div>
            <p style="color: #94a3b8; font-size: 14px;">Bu kod 5 dəqiqə ərzində etibarlıdır. Əgər bu tələbi siz etməmisinizsə, zəhmət olmasa bu mesaja məhəl qoymayın.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #cbd5e1; font-size: 12px;">© ${new Date().getFullYear()} AzEstetik GROUP. Bütün hüquqlar qorunur.</p>
        </div>
    `;

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log(`[EMAIL MOCK] To: ${toEmail} | OTP: ${otpCode} | Action: ${subject}`);
            return true;
        }
        await transporter.sendMail({
            from: `"AzEstetik Club" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent
        });
        return true;
    } catch (error) {
        console.error('Email göndərmə xətası:', error);
        return false;
    }
};

module.exports = { sendOtpEmail };
