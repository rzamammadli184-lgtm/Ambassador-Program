$port = 8085
$root = "c:\Users\rzama\.gemini\antigravity\scratch\Ambassador_Program"
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Server started on http://127.0.0.1:$port/"
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestUrl = $context.Request.Url.LocalPath
        $filePath = Join-Path $root $requestUrl.Replace('/', '\')
        if ($filePath.EndsWith('\')) { $filePath = Join-Path $filePath "index.html" }
        if (Test-Path $filePath -PathType Leaf) {
            $buffer = [IO.File]::ReadAllBytes($filePath)
            $context.Response.ContentLength64 = $buffer.Length
            if ($filePath.EndsWith('.html')) { $context.Response.ContentType = "text/html; charset=utf-8" }
            elseif ($filePath.EndsWith('.css')) { $context.Response.ContentType = "text/css" }
            elseif ($filePath.EndsWith('.js')) { $context.Response.ContentType = "application/javascript" }
            elseif ($filePath.EndsWith('.json')) { $context.Response.ContentType = "application/json; charset=utf-8" }
            elseif ($filePath.EndsWith('.png')) { $context.Response.ContentType = "image/png" }
            elseif ($filePath.EndsWith('.jpg') -or $filePath.EndsWith('.jpeg')) { $context.Response.ContentType = "image/jpeg" }
            $context.Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $context.Response.Headers.Add("Pragma", "no-cache")
            $context.Response.Headers.Add("Expires", "0")
            $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $context.Response.StatusCode = 404
        }
        $context.Response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
