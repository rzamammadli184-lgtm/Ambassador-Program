$htmlFiles = Get-ChildItem -Path "c:\Users\rzama\.gemini\antigravity\scratch\Ambassador_Program\ambassador_*.html" -Exclude "ambassador_ai.html"

foreach ($file in $htmlFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    $content = $content.Replace('Xo? G?ldiniz', 'Xosh Geldiniz')
    $content = $content.Replace('?b?k?m', 'Shebekem')
    $content = $content.Replace('M??t?ri', 'Mushteri')
    $content = $content.Replace('e?b?k?', 'Shebeke')
    $content = $content.Replace('?mumi', 'Umumi')
    $content = $content.Replace('Sat??', 'Satish')
    $content = $content.Replace('ezvl?ri', 'uzvleri')
    $content = $content.Replace('Bal?', 'Bali')
    $content = $content.Replace('HADeS? / eZV', 'HADISE / UZV')
    $content = $content.Replace('TAReX', 'TARIX')
    $content = $content.Replace('M?hsul', 'Mehsul')
    $content = $content.Replace('S?viyy?', 'Seviyye')
    $content = $content.Replace('T?lim', 'Telim')
    $content = $content.Replace('T?qdimat', 'Teqdimat')
    $content = $content.Replace('M?rk?z', 'Merkez')
    $content = $content.Replace('?n ', 'En ')
    $content = $content.Replace('Sistemd?', 'Sistemde')
    $content = $content.Replace('resmi Ambassador v?', 'resmi Ambassador ve')
    $content = $content.Replace('melumatlar yekl?nir...', 'melumatlar yuklenir...')
    $content = $content.Replace('Mehsullare', 'Mehsullari')
    $content = $content.Replace('Meet?ril?r', 'Mushteriler')
    $content = $content.Replace('Meet?ri', 'Mushteri')
    $content = $content.Replace('Ae Analitika', 'AI Analitika')
    $content = $content.Replace('emumi Satee Bale', 'Umumi Satish Bali')
    $content = $content.Replace('eShebekem', 'Shebekem')
    $content = $content.Replace('Kem?k', 'Komek')
    $content = $content.Replace('Sualenez', 'Sualiniz')
    $content = $content.Replace('Gend?r', 'Gonder')
    $content = $content.Replace('e?b?k? ezvl?ri', 'Shebeke Uzvleri')
    $content = $content.Replace('e?b?k?', 'Shebeke')

    # Font handling
    if (-not $content.Contains('Poppins')) {
        $content = $content -replace '<meta charset="UTF-8">', "<meta charset=`"UTF-8`">`n    <link href=`"https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap`" rel=`"stylesheet`">`n    <style>* { font-family: 'Poppins', sans-serif !important; }</style>"
    }

    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.UTF8Encoding]::new($false))
}
Write-Output "Done text replacements perfectly!"
