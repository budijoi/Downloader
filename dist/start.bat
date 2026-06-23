@echo off
title Media Downloader
cd /d "%~dp0"

echo ============================================
echo   Media Downloader
echo   Server: http://localhost:3000
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan!
    echo Install dari https://nodejs.org
    pause
    exit /b 1
)

:: Check npm deps
if not exist "node_modules" (
    echo [INFO] Menginstall dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        pause
        exit /b 1
    )
)

:: Check yt-dlp
python -c "import yt_dlp" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Menginstall yt-dlp...
    python -m pip install yt-dlp
)

:: Check ffmpeg
where ffmpeg >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] ffmpeg tidak ditemukan.
    echo Audio download dan merge video mungkin gagal.
    echo Install dari: https://ffmpeg.org/download.html
    echo.
)

echo.
echo Server starting... Buka http://localhost:3000
echo.
start http://localhost:3000
npm start
pause
