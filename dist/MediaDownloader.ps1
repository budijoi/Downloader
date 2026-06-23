# Media Downloader Launcher

$port = 3000
$serverDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $serverDir

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Media Downloader" -ForegroundColor Cyan
Write-Host "  Server: http://localhost:$port" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$node = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "[ERROR] Node.js tidak ditemukan!" -ForegroundColor Red
    Write-Host "Install dari https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm deps
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Menginstall dependencies..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check yt-dlp
try {
    $null = python -c "import yt_dlp" 2>&1
} catch {
    Write-Host "[INFO] Menginstall yt-dlp..." -ForegroundColor Yellow
    python -m pip install yt-dlp
}

# Check ffmpeg
$ffmpeg = Get-Command "ffmpeg" -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Host "[WARNING] ffmpeg tidak ditemukan." -ForegroundColor Yellow
    Write-Host "Audio download dan merge video mungkin gagal." -ForegroundColor Yellow
    Write-Host "Install dari: https://ffmpeg.org/download.html" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Server starting... Buka http://localhost:$port" -ForegroundColor Green
Write-Host "Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:$port"
npm start
