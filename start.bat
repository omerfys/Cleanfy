@echo off
chcp 65001 >nul
title Cleanfy - Masaüstü Robot Süpürgesi Başlatıcı

echo ===================================================
echo     🤖 Cleanfy: Masaüstü Robot Süpürgesi
echo ===================================================
echo.

cd /d "%~dp0"

if exist "release\win-unpacked\Cleanfy Robot Süpürge.exe" (
    echo [OK] Derlenmis Windows paketi bulundu!
    echo Uygulama baslatiliyor...
    start "" "release\win-unpacked\Cleanfy Robot Süpürge.exe"
    exit /b 0
)

echo [BILGI] Derlenmis paket bulunamadi, gelistirme modunda baslatiliyor...
echo.

if not exist "node_modules\" (
    echo Bagimliliklar yukleniyor (npm install)...
    call npm install
)

echo Gelistirici sunucusu ve masaustu arayuzu calistiriliyor...
call npm start

pause
