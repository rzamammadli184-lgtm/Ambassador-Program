# Fix all ambassador HTML files - replace corrupted Unicode with clean ASCII
$dir = 'c:\Users\rzama\.gemini\antigravity\scratch\Ambassador_Program'
$files = Get-ChildItem "$dir\ambassador_*.html" -Exclude 'ambassador_ai.html'

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Replace U+FFFD (replacement char) that appears before known patterns
    # Navigation items - fix known words
    $content = $content -replace '\?{1,2}b\?k\?m', 'Shebekem'
    $content = $content -replace 'M\?{1,2}t\?ri', 'Mushteri'
    $content = $content -replace 'M\?hsullar', 'Mehsullar'
    $content = $content -replace 'Liderl\?r', 'Liderler'
    $content = $content -replace 'T\?dbirl\?r', 'Tedbirler'
    $content = $content -replace 'D\?st\?k', 'Destek'
    $content = $content -replace 'T\?nziml\?m\?l\?r', 'Tenzimlemeler'
    $content = $content -replace 'A\? Analitika', 'AI Analitika'
    $content = $content -replace 'Ai? Analitika', 'AI Analitika'
    
    # Common Azerbaijani words in content
    $content = $content -replace 'Xo\? G\?ldiniz', 'Xosh Geldiniz'
    $content = $content -replace 'Son F\?aliyy\?tl\?r', 'Son Fealiyyetler'
    $content = $content -replace 'G\?z\?llik', 'Gozellik'
    $content = $content -replace 's\?nayesin', 'senayesin'
    $content = $content -replace 'liderl\?rin', 'liderlerin'
    $content = $content -replace 'r\?smi', 'resmi'
    $content = $content -replace '\?{1,2}mumi', 'Umumi'
    $content = $content -replace '\?zvl\?ri', 'uzvleri'
    $content = $content -replace 'Toplam M\?\?t\?ri', 'Toplam Mushteri'
    $content = $content -replace 'Sat\?\?', 'Satish'
    $content = $content -replace 'Bal\?', 'Bali'
    $content = $content -replace 'HAD\?\?', 'HADISE'
    $content = $content -replace 'TAR\?X', 'TARIX'
    $content = $content -replace 'noyabr\s?\?', 'noyabr'
    $content = $content -replace 'd\?vriyy\?', 'dovriyye'
    $content = $content -replace '\?laq\?', 'elaqe'
    $content = $content -replace 'M\?\?t\?ri', 'Mushteri'
    $content = $content -replace 'g\?ldiniz', 'geldiniz'
    $content = $content -replace 'm\?lumat', 'melumat'
    $content = $content -replace 'k\?m\?k', 'komek'
    $content = $content -replace 'shebok\?', 'shebeke'
    $content = $content -replace 't\?hlil', 'tehlil'
    $content = $content -replace 'h\?r\?k\?t', 'hereket'
    $content = $content -replace 'n\?tic\?', 'netice'
    $content = $content -replace 'b\?lm\?', 'bolme'
    $content = $content -replace 'g\?st\?rici', 'gosterici'
    $content = $content -replace 'y\?kl\?n', 'yuklen'
    $content = $content -replace 'g\?z\?l', 'gozel'
    
    # Generic: replace any remaining lone ? that's likely a corrupted ə
    # But be careful not to replace legitimate ?
    # Replace FFFD character (U+FFFD = replacement character)
    $content = $content -replace [char]0xFFFD, 'e'
    
    # Add Poppins font if not already present
    if (-not $content.Contains('Poppins')) {
        $content = $content -replace '(<meta charset="UTF-8">)', '$1
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>* { font-family: ''Poppins'', sans-serif !important; }</style>'
    }
    
    # Remove any Excel references
    $content = $content -replace 'Excel-d\?n', 'Merkezi bazadan'
    $content = $content -replace 'Excel', 'Sistem'
    
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Output "Fixed: $($file.Name)"
}

Write-Output "ALL FILES FIXED"
