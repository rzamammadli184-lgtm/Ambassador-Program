$files = Get-ChildItem -Path "c:\Users\rzama\.gemini\antigravity\scratch\Ambassador_Program\ambassador_*.html"
$themeScript = @"
        // Theme Toggle Logic
        function initTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-mode');
            }
            updateThemeIcon();
        }

        function toggleTheme() {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            updateThemeIcon();
        }

        function updateThemeIcon() {
            const iconElement = document.getElementById('theme-icon');
            if(iconElement) {
                const isLight = document.body.classList.contains('light-mode');
                // We recreate the icon based on lucide API
                iconElement.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
                lucide.createIcons();
            }
        }
        
        // Init theme on load
        document.addEventListener('DOMContentLoaded', initTheme);
        // Also run immediately just in case
        initTheme();
"@

$themeButton = '<button class="theme-toggle" onclick="toggleTheme()"><i data-lucide="sun" id="theme-icon"></i></button>'

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # 1. Add Theme Toggle Button to Header Actions if not exists
    if ($content -notmatch 'class="theme-toggle"') {
        $content = $content -replace '<div class="header-actions">', "<div class=`"header-actions`">`n                    $themeButton"
    }

    # 2. Add Animation classes to cards
    $content = $content -replace 'class="stat-card"', 'class="stat-card animate-slide-up"'
    $content = $content -replace 'class="modern-card"', 'class="modern-card animate-slide-up delay-100"'
    $content = $content -replace 'class="content-grid"', 'class="content-grid animate-fade-in delay-200"'

    # 3. Add JS script before </body>
    if ($content -notmatch 'function toggleTheme') {
        $content = $content -replace '</body>', "$themeScript`n</body>"
    }

    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}
Write-Host "Bütün HTML fayllarına animasiyalar və Gecə/Gündüz rejimi uğurla əlavə olundu!"
