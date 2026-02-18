@echo off
chcp 65001 >nul
echo ==========================================
echo Smart Macro Tool - Windows Setup
echo ==========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Please run this script as Administrator
    echo Right-click -^> Run as Administrator
    pause
    exit /b 1
)

:: Check Node.js
echo 📦 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js found
echo.

:: Check Python
echo 🐍 Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.9+ from https://python.org/
    pause
    exit /b 1
)
echo ✅ Python found
echo.

:: Install root dependencies
echo 📥 Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)
echo ✅ Root dependencies installed
echo.

:: Install frontend dependencies
echo 📥 Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed
echo.
cd ..

:: Install backend dependencies
echo 📥 Installing backend dependencies...
cd backend
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed
echo.
cd ..

:: Create environment file if not exists
echo 📝 Setting up configuration...
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo ✅ Created backend\.env file
    echo ℹ️  Please edit backend\.env to configure your AI provider
) else (
    echo ✅ Environment file already exists
)
echo.

:: Create necessary directories
echo 📁 Creating directories...
if not exist backend\uploads mkdir backend\uploads
if not exist backend\temp mkdir backend\temp
if not exist backend\macros mkdir backend\macros
echo ✅ Directories created
echo.

:: Check for Ollama
echo 🤖 Checking Ollama installation...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama not found. Install from https://ollama.ai for local AI
    echo ℹ️  You can also use OpenAI/Anthropic by editing backend\.env
) else (
    echo ✅ Ollama found
    echo 📥 Downloading llama2 model...
    ollama pull llama2
)
echo.

echo ==========================================
echo ✅ Setup Complete!
echo ==========================================
echo.
echo 🚀 To start the application:
echo    1. Open Terminal 1: cd backend ^&^& python -m uvicorn app.main:app --reload --port 8000
echo    2. Open Terminal 2: cd frontend ^&^& npm run dev
echo    3. Or run: npm run dev
echo.
echo 📖 For detailed instructions, see SETUP.md
echo.
pause
