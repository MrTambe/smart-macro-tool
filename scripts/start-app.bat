@echo off
echo Starting Smart Macro Tool Application...
echo.

REM Kill any existing processes on ports 8000 and 5173
taskkill /F /IM "python.exe" /FI "WINDOWTITLE eq *uvicorn*" 2>nul
taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq *vite*" 2>nul

echo Starting Backend Server...
start "Smart Macro Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend Development Server...
start "Smart Macro Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application is starting...
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:5173
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:5173
