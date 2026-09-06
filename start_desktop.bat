@echo off
title ELECTRON DESKTOP CLIENT - BASARI IT SOLUTIONS
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
echo   [+] ELECTRON DESKTOP CLIENT + FLATBED SCANNER ENGINE
echo   [+] Developed ^& Powered by: BASARI IT SOLUTIONS
echo ===========================================================================
echo.
cd /d "%~dp0client"
npm run app:dev
pause
