import os
import glob
import re

html_files = glob.glob('ambassador_*.html')

sidebar_li = '<li><a href="ambassador_ai.html" class="nav-link"><i data-lucide="bot"></i> Aİ Analitika</a></li>\n            <li><a href="ambassador_leaderboard.html"'

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already added
    if 'href="ambassador_ai.html"' in content:
        continue
        
    # Add to mobile nav and desktop nav
    content = content.replace('<li><a href="ambassador_leaderboard.html"', sidebar_li)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Updated {len(html_files)} files with AI Analytics link.")
