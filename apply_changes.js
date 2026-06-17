const fs = require('fs');

// 1. Modify dashboard (Remove Liderlər & İxrac)
let dashContent = fs.readFileSync('ambassador_dashboard.html', 'utf8');
dashContent = dashContent.replace(/<a href="ambassador_leaderboard\.html" class="quick-action-btn"><i data-lucide="trophy"[^>]*>.*?<\/a>/g, '');
dashContent = dashContent.replace(/<button onclick="exportData\(\)" class="quick-action-btn"[^>]*><i data-lucide="download"[^>]*>.*?<\/button>/g, '');
fs.writeFileSync('ambassador_dashboard.html', dashContent);

// 2. Modify products (Update WhatsApp link)
let prodContent = fs.readFileSync('ambassador_products.html', 'utf8');
prodContent = prodContent.replace(/href="https:\/\/wa\.me\/\d+"/g, 'href="https://wa.me/994552265033"');
prodContent = prodContent.replace(/href='https:\/\/wa\.me\/\d+'/g, "href='https://wa.me/994552265033'");
prodContent = prodContent.replace(/window\.open\('https:\/\/wa\.me\/\d+'/g, "window.open('https://wa.me/994552265033'");
fs.writeFileSync('ambassador_products.html', prodContent);

// 3. Modify referral_register.html (Add region)
let refContent = fs.readFileSync('referral_register.html', 'utf8');
if (!refContent.includes('id="reg-region"')) {
    const regionHtml = `
                    <div class="form-group">
                        <label>Region / Şəhər</label>
                        <i data-lucide="map-pin" class="input-icon" style="width:18px;height:18px;"></i>
                        <select id="reg-region" required style="width: 100%; padding: 14px 16px 14px 44px; background: var(--bg); border: 1px solid var(--border); border-radius: 16px; font-size: 1rem; color: var(--text-main); outline: none; transition: 0.3s; cursor: pointer; appearance: none;">
                            <option value="" disabled selected>Bölgəni seçin</option>
                            <option value="Bakı">Bakı</option>
                            <option value="Sumqayıt">Sumqayıt</option>
                            <option value="Gəncə">Gəncə</option>
                            <option value="Mingəçevir">Mingəçevir</option>
                            <option value="Şirvan">Şirvan</option>
                            <option value="Lənkəran">Lənkəran</option>
                            <option value="Yevlax">Yevlax</option>
                            <option value="Ağdam">Ağdam</option>
                            <option value="Naxçıvan">Naxçıvan</option>
                            <option value="Şəki">Şəki</option>
                            <option value="Quba">Quba</option>
                            <option value="Xaçmaz">Xaçmaz</option>
                            <option value="Digər">Digər (Rayon / Kənd)</option>
                        </select>
                    </div>`;
    
    refContent = refContent.replace('<div class="form-group">\n                        <label>E-poçt Ünvanı</label>', regionHtml + '\n                    <div class="form-group">\n                        <label>E-poçt Ünvanı</label>');
    
    // update handleRegister
    refContent = refContent.replace("const pass = document.getElementById('reg-pass').value;", "const pass = document.getElementById('reg-pass').value;\n            const region = document.getElementById('reg-region').value;");
    refContent = refContent.replace("body: JSON.stringify({ fullName: name, email, password: pass, refCode: refCode || undefined })", "body: JSON.stringify({ fullName: name, email, password: pass, region, refCode: refCode || undefined })");
    
    fs.writeFileSync('referral_register.html', refContent);
}

// 4. Modify User.js
let userContent = fs.readFileSync('backend/models/User.js', 'utf8');
if (!userContent.includes('region: {')) {
    userContent = userContent.replace("referredBy: {", "region: {\n        type: DataTypes.STRING,\n        allowNull: true\n    },\n    referredBy: {");
    fs.writeFileSync('backend/models/User.js', userContent);
}

// 5. Modify auth.js
let authContent = fs.readFileSync('backend/routes/auth.js', 'utf8');
if (authContent.includes('const { fullName, email, password, referredBy } = req.body;')) {
    authContent = authContent.replace('const { fullName, email, password, referredBy } = req.body;', 'const { fullName, email, password, region, referredBy } = req.body;');
    authContent = authContent.replace('await User.create({ fullName, email, passwordHash, isVerified: false, referredBy: referredBy || null, myReferralCode: refCode });', 'await User.create({ fullName, email, passwordHash, region: region || null, isVerified: false, referredBy: referredBy || null, myReferralCode: refCode });');
    fs.writeFileSync('backend/routes/auth.js', authContent);
}

console.log("All changes applied successfully.");
