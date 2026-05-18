$db = Get-Content "database.json" -Raw | ConvertFrom-Json
$rawAmb = $db.AMB
$rowsPast494 = $rawAmb | Where-Object { $_.rowNum -ge 495 }
Write-Host "Total rows past 494 in AMB sheet: $($rowsPast494.Count)"

$activeRowsPast494 = $rowsPast494 | Where-Object {
    $hasVal = $false
    foreach ($k in $_.data.psobject.Properties.Name) {
        $val = $_.data.$k
        if ($val -and $val.ToString().Trim() -ne "") {
            # Ignore A and D if they are just sequential numbers/IDs
            if ($k -ne "A" -and $k -ne "D" -and $k -ne "RowNum") {
                $hasVal = $true
                break
            }
        }
    }
    $hasVal
}
Write-Host "Rows past 494 that have actual data (excluding A and D): $($activeRowsPast494.Count)"

if ($activeRowsPast494.Count -gt 0) {
    Write-Host "Sample rows past 494 with data:"
    $activeRowsPast494 | Select-Object -First 15 | ForEach-Object {
        $line = "Row $($_.rowNum): "
        foreach ($k in $_.data.psobject.Properties.Name) {
            $line += "$k=$($_.data.$k) | "
        }
        Write-Host $line
    }
}
