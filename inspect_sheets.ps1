$db = Get-Content "database.json" -Raw | ConvertFrom-Json
foreach ($p in $db.psobject.Properties) {
    Write-Host "================ SHEET: $($p.Name) ================"
    $first5 = $p.Value | Select-Object -First 5
    foreach ($r in $first5) {
        $line = "Row $($r.rowNum): "
        foreach ($k in $r.data.psobject.Properties.Name) {
            $line += "$k=$($r.data.$k) | "
        }
        Write-Host $line
    }
}
