$sharedStringsPath = "extracted_excel/xl/sharedStrings.xml"
$sheet1Path = "extracted_excel/xl/worksheets/sheet1.xml"

if (!(Test-Path $sheet1Path)) {
    Write-Host "Sheet1 not found!"
    exit
}

# Load Shared Strings
$sharedStrings = @()
if (Test-Path $sharedStringsPath) {
    [xml]$ssXml = Get-Content $sharedStringsPath -Encoding UTF8
    # Extract strings from <si><t>... or <si><r><t>...
    foreach ($si in $ssXml.sst.si) {
        $text = ""
        if ($si.t) {
            $text = $si.t.InnerText
        } elseif ($si.r) {
            foreach ($r in $si.r) {
                if ($r.t) {
                    $text += $r.t.InnerText
                }
            }
        }
        $sharedStrings += $text
    }
}

# Load Sheet1
[xml]$sheetXml = Get-Content $sheet1Path

$rows = $sheetXml.worksheet.sheetData.row
Write-Output "Parsed sheet data:"
$maxRows = 30 # let's read first 30 rows

foreach ($row in $rows) {
    $rowNum = [int]$row.r
    if ($rowNum -gt $maxRows) { break }
    
    $rowCells = @{}
    foreach ($cell in $row.c) {
        $ref = $cell.r # e.g. A1, B1
        $val = ""
        if ($cell.v) {
            $val = $cell.v.InnerText
            if ($cell.t -eq "s") {
                # Shared string
                $index = [int]$val
                $val = $sharedStrings[$index]
            }
        }
        
        # Extract column letter
        $colLetter = $ref -replace '\d+'
        $rowCells[$colLetter] = $val
    }
    
    # Sort columns alphabetically to print in order
    $sortedCols = $rowCells.Keys | Sort-Object
    $line = "Row $rowNum : "
    foreach ($col in $sortedCols) {
        $line += "$col=$($rowCells[$col]) | "
    }
    Write-Output $line
}
