$ErrorActionPreference = 'Stop'
$previewUrl = 'http://127.0.0.1:4173/'
try { $previewExisting = (Invoke-WebRequest -Uri $previewUrl -TimeoutSec 2).Content } catch { $previewExisting = '' }
if ($previewExisting -notmatch '一张正在运动的地图') {
    if ($previewExisting) { throw '4173端口已被其他服务占用。请用 node server.mjs --port 4174 启动，访问 http://127.0.0.1:4174/ 。' }
    $previewNode = (Get-Command node.exe -ErrorAction Stop).Source
    Start-Process -FilePath $previewNode -ArgumentList @('server.mjs', '--port', '4173') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    Start-Sleep -Milliseconds 800
}
Start-Process $previewUrl
