#!/bin/bash

echo "=========================================="
echo "Smart Macro Tool - Windows Setup"
echo "=========================================="
echo ""

# Check if running as administrator
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "⚠️  Please run PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell -> Run as Administrator"
    exit 1
}

# Check Node.js
Write-Host "📦 Checking Node.js installation..." -ForegroundColor Cyan
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green
echo ""

# Check Python
Write-Host "🐍 Checking Python installation..." -ForegroundColor Cyan
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install from https://python.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python found: $(python --version)" -ForegroundColor Green
echo ""

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Cyan

try {
    npm install
    Write-Host "✅ Root dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

Set-Location frontend
try {
    npm install
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

Set-Location backend
try {
    pip install -r requirements.txt
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Setup environment
Write-Host "📝 Setting up configuration..." -ForegroundColor Cyan
if (!(Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Created backend\.env file" -ForegroundColor Green
} else {
    Write-Host "✅ Environment file already exists" -ForegroundColor Green
}
echo ""

# Create directories
Write-Host "📁 Creating directories..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "backend\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\temp" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\macros" | Out-Null
Write-Host "✅ Directories created" -ForegroundColor Green
echo ""

# Check Ollama
Write-Host "🤖 Checking Ollama..." -ForegroundColor Cyan
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "✅ Ollama found" -ForegroundColor Green
    Write-Host "📥 Downloading llama2 model..." -ForegroundColor Cyan
    ollama pull llama2
} else {
    Write-Host "⚠️  Ollama not found. Install from https://ollama.ai for local AI" -ForegroundColor Yellow
    Write-Host "ℹ️  You can also use OpenAI/Anthropic by editing backend\.env" -ForegroundColor Cyan
}
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
Write-Host "🚀 To start the application:" -ForegroundColor Green
echo "   1. Terminal 1: cd backend; python -m uvicorn app.main:app --reload --port 8000"
echo "   2. Terminal 2: cd frontend; npm run dev"
echo "   Or: npm run dev"
echo ""
Write-Host "📖 See SETUP.md for detailed instructions" -ForegroundColor Cyan
Read-Host -Prompt "Press Enter to exit"
