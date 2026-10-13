$ErrorActionPreference = 'Stop'
$observatoryUrl = 'http://127.0.0.1:4180/'
try { $observatoryPage = (Invoke-WebRequest -Uri $observatoryUrl -TimeoutSec 2).Content } catch { $observatoryPage = '' }
if ($observatoryPage -notmatch '一片星空') {
    if ($observatoryPage) { throw '4180端口已有其他服务。可用 node server.mjs --port 4181 并访问相应地址。' }
    $observatoryNode = (Get-Command node.exe -ErrorAction Stop).Source
    Start-Process -FilePath $observatoryNode -ArgumentList @('server.mjs', '--port', '4180') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    Start-Sleep -Milliseconds 800
}
Start-Process $observatoryUrl
