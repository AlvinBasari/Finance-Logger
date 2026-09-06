@echo off
title SISTEM LOGGER & PENGARSIPAN INVOICE - BASARI IT SOLUTIONS
cls
color 0B

echo ===========================================================================
echo    ____       _    ____    _    ____  ___  
echo   ^| __ )     / \  / ___^|  / \  ^|  _ \^|_ _^| 
echo   ^|  _ \    / _ \ \___ \ / _ \ ^| ^|_) ^|^| ^|  
echo   ^| ^|_) ^|  / ___ \ ___) / ___ \^|  _ ^< ^| ^|  
echo   ^|____/  /_/   \_\____/_/   \_\_^| \_\___^| 
echo                   I T   S O L U T I O N S
echo ===========================================================================
echo   [+] SISTEM LOGGER ^& PENGARSIPAN DIGITAL INVOICE (ENTERPRISE)
echo   [+] Developed ^& Powered by: BASARI IT SOLUTIONS
echo   [+] Platform: Desktop Client (Electron) + Backend API (Laravel)
echo ===========================================================================
echo.
echo   [*] [1/2] Menjalankan Backend Laravel API di background (Port 8088)...
start "Finance Backend API (Port 8088)" cmd /c "cd /d "%~dp0backend" && php artisan serve --host=127.0.0.1 --port=8088"
timeout /t 2 /nobreak >nul

echo   [*] [2/2] Menjalankan Aplikasi Desktop Electron + Scanner Engine...
cd /d "%~dp0client"
npm run app:dev
