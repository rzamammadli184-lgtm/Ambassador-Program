$path = 'c:\Users\rzama\.gemini\antigravity\scratch\Ambassador_Program\ambassador_ai.html'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$map = @{
    'Ã\u0096' = 'Ö'; 'Ã¶' = 'ö'; 'Ãœ' = 'Ü'; 'Ã¼' = 'ü'
    'Ä°' = 'İ'; 'Ä±' = 'ı'; 'Äž' = 'Ğ'; 'ÄŸ' = 'ğ'
    'Åž' = 'Ş'; 'ÅŸ' = 'ş'; 'Ã‡' = 'Ç'; 'Ã§' = 'ç'
    'Æ' = 'Ə'; 'É™' = 'ə'
    'â€"' = '–'; 'â€"' = '—'; 'â€˜' = "'"; 'â€™' = "'"
    'â€œ' = '"'; 'â€' = '"'
}

foreach ($k in $map.Keys) {
    $content = $content.Replace($k, $map[$k])
}

# Fix broken emoji references
$content = $content -replace 'ğŸ"', '' -replace "ğŸ'¡", '' -replace 'âš ï¸', '' -replace 'ğŸ"Š', ''
$content = $content -replace 'ğŸ‚', '' -replace "ğŸ'¤", '' -replace "ğŸ'", '' -replace "ğŸ'¥", ''

# Add Poppins font import after charset
$content = $content.Replace(
    '<meta charset="UTF-8">',
    '<meta charset="UTF-8">' + "`n" + '    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">'
)

# Fix title
$content = $content -replace '<title>[^<]*</title>', '<title>AzEstetik - Aİ Analitika</title>'

# Fix the garbled nav items
$content = $content -replace 'Å\?É™bÉ™kÉ™m', 'Şəbəkəm'
$content = $content -replace 'MÃ¼ÅŸtÉ™rilÉ™r', 'Müştərilər'
$content = $content -replace 'MÉ™hsullar', 'Məhsullar'
$content = $content -replace 'LiderlÉ™r', 'Liderlər'
$content = $content -replace 'TÉ™dbirlÉ™r', 'Tədbirlər'
$content = $content -replace 'DÉ™stÉ™k', 'Dəstək'
$content = $content -replace 'TÉ™nzimlÉ™mÉ™lÉ™r', 'Tənzimləmələr'

# Final pass - any remaining broken chars
$content = $content.Replace('É™', 'ə').Replace('Ã¼', 'ü').Replace('Ã¶', 'ö')
$content = $content.Replace('ÅŸ', 'ş').Replace('Åž', 'Ş').Replace('ÄŸ', 'ğ')
$content = $content.Replace('Ä±', 'ı').Replace('Ä°', 'İ').Replace('Ã§', 'ç')

[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($true))
Write-Output "DONE - All encoding fixed, Poppins added"
