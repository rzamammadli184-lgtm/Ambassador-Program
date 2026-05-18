$sharedStringsPath = "extracted_excel/xl/sharedStrings.xml"
$sheet1Path = "extracted_excel/xl/worksheets/sheet1.xml"

# Load Shared Strings
$sharedStrings = @()
if (Test-Path $sharedStringsPath) {
    [xml]$ssXml = Get-Content $sharedStringsPath -Encoding UTF8
    foreach ($si in $ssXml.sst.ChildNodes) {
        if ($si.LocalName -eq "si") {
            $text = ""
            $tNode = $si.ChildNodes | Where-Object { $_.LocalName -eq "t" }
            if ($tNode) {
                $text = $tNode.InnerText
            } else {
                # Look inside <r>
                foreach ($r in $si.ChildNodes) {
                    if ($r.LocalName -eq "r") {
                        $rt = $r.ChildNodes | Where-Object { $_.LocalName -eq "t" }
                        if ($rt) { $text += $rt.InnerText }
                    }
                }
            }
            $sharedStrings += $text
        }
    }
}

Write-Host "Shared strings count: $($sharedStrings.Count)"

# Load Sheet1
[xml]$sheetXml = Get-Content $sheet1Path
$sheetData = $sheetXml.worksheet.ChildNodes | Where-Object { $_.LocalName -eq "sheetData" }

foreach ($row in $sheetData.ChildNodes) {
    if ($row.LocalName -eq "row") {
        $rowNum = $row.Attributes["r"].Value
        if ([int]$rowNum -gt 40) { break }
        
        $rowCells = @{}
        foreach ($c in $row.ChildNodes) {
            if ($c.LocalName -eq "c") {
                $ref = $c.Attributes["r"].Value
                $tAttr = $c.Attributes["t"]
                $t = if ($tAttr) { $tAttr.Value } else { "" }
                
                $vNode = $c.ChildNodes | Where-Object { $_.LocalName -eq "v" }
                $val = if ($vNode) { $vNode.InnerText } else { "" }
                
                if ($t -eq "s" -and $val -ne "") {
                    $index = [int]$val
                    $val = $sharedStrings[$index]
                }
                
                $colLetter = $ref -replace '\d+'
                $rowCells[$colLetter] = $val
            }
        }
        
        $sortedCols = $rowCells.Keys | Sort-Object
        $line = "Row $rowNum : "
        foreach ($col in $sortedCols) {
            $line += "$col=$($rowCells[$col]) | "
        }
        Write-Output $line
    }
}
