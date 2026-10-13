$ErrorActionPreference = 'Stop'
$previewUrl = 'http://127.0.0.1:4174/'
try { $existingPreview = (Invoke-WebRequest -Uri $previewUrl -TimeoutSec 2).Content } catch { $existingPreview = '' }
if ($existingPreview -notmatch '两种视角') {
    if ($existingPreview) { throw '4174端口被其他服务占用。请用 node server.mjs --port 4175 启动并访问对应地址。' }
    $previewNode = (Get-Command node.exe -ErrorAction Stop).Source
    Start-Process -FilePath $previewNode -ArgumentList @('server.mjs', '--port', '4174') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    Start-Sleep -Milliseconds 800
}
Start-Process $previewUrl
