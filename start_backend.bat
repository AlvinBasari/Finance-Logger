@echo off
title LARAVEL BACKEND API - BASARI IT SOLUTIONS
cls
color 0A

echo ===========================================================================
echo    ____       _    ____    _    ____  ___  
echo   ^| __ )     / \  / ___^|  / \  ^|  _ \^|_ _^| 
echo   ^|  _ \    / _ \ \___ \ / _ \ ^| ^|_) ^|^| ^|  
echo   ^| ^|_) ^|  / ___ \ ___) / ___ \^|  _ ^< ^| ^|  
echo   ^|____/  /_/   \_\____/_/   \_\_^| \_\___^| 
echo                   I T   S O L U T I O N S
echo ===========================================================================
echo   [+] LARAVEL RESTFUL API ENGINE (Port 8088)
echo   [+] Developed ^& Powered by: BASARI IT SOLUTIONS
echo ===========================================================================
echo.
cd /d "%~dp0backend"
php artisan serve --host=127.0.0.1 --port=8088
pause
