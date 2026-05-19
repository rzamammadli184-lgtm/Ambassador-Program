import os
import glob
import re

html_files = glob.glob('ambassador_*.html')

replacements = {
    r'eShebekem': 'Shebekem',
    r'\?\?b\?k\?m': 'Shebekem',
    r'Meet\?ril\?r': 'Mushteriler',
    r'M\?\?t\?ril\?r': 'Mushteriler',
    r'Ae Analitika': 'AI Analitika',
    r'A\? Analitika': 'AI Analitika',
    r'Xoe geldiniz': 'Xosh Geldiniz',
    r'Xo\? G\?ldiniz': 'Xosh Geldiniz',
    r'melumatlar yekl\?nir...': 'melumatlar yuklenir...',
    r'm\?lumatlar y\?kl\?nir': 'melumatlar yuklenir',
    r'emumi Satee Bale': 'Umumi Satish Bali',
    r'\?\?mumi Sat\?\? Bal\?': 'Umumi Satish Bali',
    r'e\?b\?k\? ezvl\?ri': 'Shebeke Uzvleri',
    r'\?\?b\?k\? \?zvl\?ri': 'Shebeke Uzvleri',
    r'HADeS\? / eZV': 'HADISE / UZV',
    r'HAD\?\? / \?ZV': 'HADISE / UZV',
    r'TAReX': 'TARIX',
    r'TAR\?X': 'TARIX',
    r'Top Satee \(Aparatura\)': 'Top Satish (Aparatura)',
    r'Top Sat\?\? \(Aparatura\)': 'Top Satish (Aparatura)',
    r'Sistemd\?': 'Sistemde',
    r'Ambassador v\?': 'Ambassador ve',
    r'M\?\?t\?ri': 'Mushteri',
    r'Meet\?ri': 'Mushteri',
    r'Top Satee': 'Top Satish',
    r'Liderl\?r': 'Liderler',
    r'T\?dbirl\?r': 'Tedbirler',
    r'D\?st\?k': 'Destek',
    r'T\?nziml\?m\?l\?r': 'Tenzimlemeler',
    r'Son Fealiyyetler': 'Son Fealiyyetler',
    r'Son F\?aliyy\?tl\?r': 'Son Fealiyyetler',
    r'G\?z\?llik': 'Gozellik',
    r'Gezellik': 'Gozellik',
    r's\?nayesin': 'senayesin',
    r'liderl\?rin': 'liderlerin',
    r'r\?smi': 'resmi',
    r't\?hlil': 'tehlil',
    r'h\?r\?k\?t': 'hereket',
    r'n\?tic\?': 'netice',
    r'b\?lm\?': 'bolme',
    r'g\?st\?rici': 'gosterici',
    r'g\?z\?l': 'gozel',
    r'd\?vriyy\?': 'dovriyye',
    r'\?laq\?': 'elaqe',
    r'M\?hsullar': 'Mehsullar',
    r'Ai\? Analitika': 'AI Analitika',
    r'\?\?mumi': 'Umumi',
    r'\?zvl\?ri': 'uzvleri',
    r'ezvl\?ri': 'uzvleri',
    r'Sat\?\?': 'Satish',
    r'Bal\?': 'Bali',
    r'noyabr\s?\?': 'noyabr',
    r'noyabre': 'noyabr',
    r'Aparature': 'Aparatura',
    r'M\?hsul': 'Mehsul',
    r'S\?viyy\?': 'Seviyye',
    r'T\?lim': 'Telim',
    r'T\?qdimat': 'Teqdimat',
    r'S\?n\?d': 'Sened',
    r'M\?k\?z': 'Merkez',
    r'M\?rk\?z': 'Merkez',
    r'\?n': 'En',
    r'd\?r\?c\?': 'derece',
    r'\?m\?liyyat': 'emeliyyat',
    r'm\?bl\?g': 'meblegh',
    r'\?lav\?': 'elave',
    r'K\?m\?k': 'Komek',
    r'\?sas': 'esas',
    r'T\?sdiq': 'Tesdiq',
    r'\?m\?kda\?': 'emekdash',
    r'ÅžÉ™bÉ™kÉ™m': 'Shebekem',
    r'MÃ¼ÅŸtÉ™rilÉ™r': 'Mushteriler',
    r'MÉ™hsullar': 'Mehsullar',
    r'LiderlÉ™r': 'Liderler',
    r'TÉ™dbirlÉ™r': 'Tedbirler',
    r'DÉ™stÉ™k': 'Destek',
    r'TÉ™nzimlÉ™mÉ™lÉ™r': 'Tenzimlemeler',
    r'AzEstetik - ÅžÉ™bÉ™kÉ™m': 'AzEstetik - Shebekem',
}

for file in html_files:
    if file == 'ambassador_ai.html':
        continue # Already perfect
        
    with open(file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
        
    # Extra pass to fix ? that might be isolated inside known words
    content = content.replace('Xo? G?ldiniz', 'Xosh Geldiniz')
    content = content.replace('?b?k?m', 'Shebekem')
    content = content.replace('M??t?ri', 'Mushteri')
    content = content.replace('e?b?k?', 'Shebeke')
    content = content.replace('?mumi', 'Umumi')
    content = content.replace('Sat??', 'Satish')
    content = content.replace('ezvl?ri', 'uzvleri')
    content = content.replace('Bal?', 'Bali')
    content = content.replace('HADeS? / eZV', 'HADISE / UZV')
    content = content.replace('TAReX', 'TARIX')
    content = content.replace('M?hsul', 'Mehsul')
    content = content.replace('S?viyy?', 'Seviyye')
    content = content.replace('T?lim', 'Telim')
    content = content.replace('T?qdimat', 'Teqdimat')
    content = content.replace('M?rk?z', 'Merkez')
    content = content.replace('?n ', 'En ')
    content = content.replace('Sistemd?', 'Sistemde')
    content = content.replace('resmi Ambassador v?', 'resmi Ambassador ve')
    content = content.replace('melumatlar yekl?nir...', 'melumatlar yuklenir...')
    content = content.replace('Mehsullare', 'Mehsullari')
    content = content.replace('Meet?ril?r', 'Mushteriler')
    content = content.replace('Ae Analitika', 'AI Analitika')
    content = content.replace('emumi Satee Bale', 'Umumi Satish Bali')
    content = content.replace('eShebekem', 'Shebekem')

    # Add Poppins font if it's missing
    if 'Poppins' not in content:
        content = content.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">\n    <style>* { font-family: \'Poppins\', sans-serif !important; }</style>')

    # Just replace all remaining '?' if they are surrounded by letters
    content = re.sub(r'([a-zA-Z])\?([a-zA-Z])', r'\1e\2', content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Python fix applied to all HTML files.")
