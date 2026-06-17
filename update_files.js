const fs = require('fs');
const files = fs.readdirSync('.');

files.filter(f => f.endsWith('.html')).forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Add logout button to main sidebar if missing (check for </nav> in <aside class="sidebar"> or similar)
    // Actually, looking at the code, we have two `<ul class="nav-list">`. Let's just replace all </ul></nav> that don't have logout right before them.
    if (content.includes('nav-list')) {
        // Find all occurrences of </ul></nav>
        const regex = /(<li><a href="ambassador_settings\.html"[^>]*>.*?<\/a><\/li>\s*)(<\/ul>\s*<\/nav>)/g;
        let newContent = content.replace(regex, (match, p1, p2) => {
            // Check if we already added it
            if (p1.includes('Çıxış Et')) return match;
            return p1 + '<li><a href="#" onclick="logoutUser()" class="nav-link"><i data-lucide="log-out"></i> Çıxış Et</a></li>\n            ' + p2;
        });
        if (newContent !== content) {
            content = newContent;
            modified = true;
        }
    }

    // Remove "Müştəri əlavə et" button in ambassador_customers.html
    if (file === 'ambassador_customers.html' && content.includes('openAddModal()')) {
        content = content.replace(/<button onclick="openAddModal\(\)"[^>]*>[\s\S]*?<\/button>/g, '');
        modified = true;
    }

    // Add real-time polling to ambassador_branches.html
    if (file === 'ambassador_branches.html' && !content.includes('setInterval(loadRefStats')) {
        content = content.replace(/loadRefStats\(\);/, 'loadRefStats();\n        setInterval(loadRefStats, 3000); // Real-time update');
        modified = true;
    }

    // Add transparent style for logo
    if (content.includes('assets/azestetik_app_icon.png') && !content.includes('mix-blend-mode: multiply; background: transparent;')) {
        content = content.replace(/class="brand-icon" style="/g, 'class="brand-icon" style="mix-blend-mode: multiply; background: transparent; ');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
    }
});
