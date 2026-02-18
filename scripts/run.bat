@echo off
cd /d "%~dp0"
echo Starting Smart Macro Tool...
echo.
cd src\backend
start "Backend" cmd /k "python -m uvicorn app.main:app --reload --port 8000"
cd ..\..
cd src\frontend
start "Frontend" cmd /k "npm run dev"
cd ..\..
echo Done! Check the new windows.
pause
