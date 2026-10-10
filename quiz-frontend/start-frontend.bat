@echo off
cd /d "%~dp0"
echo Starting React Vite Frontend (Port 5173)...
call npm.cmd run dev
pause
