$db = Get-Content "database.json" -Raw | ConvertFrom-Json
$rawAmb = $db.AMB
$filtered = $rawAmb | Where-Object { $_.rowNum -ge 4 -and $_.data.B -and $_.data.B.ToString().Trim() -ne "" }
Write-Host "Filtered row count: $($filtered.Count)"
