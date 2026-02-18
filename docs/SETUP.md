# Smart Macro Tool - Setup Instructions

## Windows Setup

### Option 1: Quick Setup (Automated)

Run the PowerShell setup script:
```powershell
.\setup-windows.ps1
```

### Option 2: Manual Setup

#### Step 1: Install Prerequisites

1. **Install Node.js 18+**
   - Download from: https://nodejs.org/
   - Choose LTS version
   - Verify: `node --version`

2. **Install Python 3.9+**
   - Download from: https://python.org/
   - **Important**: Check "Add Python to PATH" during installation
   - Verify: `python --version`

#### Step 2: Install Dependencies

Open PowerShell in the project directory:

```powershell
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ..\backend
pip install -r requirements.txt

# Install root dependencies (for running both)
cd ..
npm install
```

#### Step 3: Setup AI (Choose one)

**Option A - Ollama (Local, Free, Private):**
```powershell
# 1. Download and install Ollama from https://ollama.ai
# 2. Open new terminal and run:
ollama pull llama2
ollama serve
```

**Option B - OpenAI (Cloud, Paid):**
```powershell
# 1. Get API key from https://platform.openai.com
# 2. Copy and edit environment file:
copy backend\.env.example backend\.env
# 3. Edit backend\.env and set:
# AI_PROVIDER=openai
# OPENAI_API_KEY=your-key-here
```

#### Step 4: Run the Application

```powershell
# In first terminal - Start backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# In second terminal - Start frontend
cd frontend
npm run dev

# Or use the combined command:
npm run dev
```

## Building for Production

### Windows Installer

```powershell
# Build the desktop application
npm run dist:win

# Installer will be created at:
# dist\Smart Macro Tool Setup 1.0.0.exe
```

This creates:
- Desktop shortcut
- Start menu entry
- Uninstaller

## Common Issues

### "python" not recognized
**Solution:** Reinstall Python and check "Add Python to PATH"

### "npm" not recognized
**Solution:** Restart your terminal or reinstall Node.js

### Port 8000 already in use
**Solution:** Change port in backend or kill the process:
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Ollama not connecting
**Solution:** Ensure Ollama is running:
```powershell
ollama serve
```

### Backend import errors
**Solution:** Make sure you're in the backend directory:
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

## File Structure After Setup

```
smart-macro-tool/
├── frontend/           # Frontend code
│   ├── node_modules/   # Frontend dependencies
│   └── dist/          # Built frontend
├── backend/           # Backend code
│   ├── venv/         # Python virtual environment (recommended)
│   └── __pycache__/  # Python cache
├── node_modules/      # Root dependencies
└── dist/             # Desktop app builds
```

## Development Workflow

### Daily Development

1. **Start the backend:**
   ```powershell
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **Start the frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Open browser:**
   - App: http://localhost:5173
   - API Docs: http://localhost:8000/docs

### Making Changes

- **Frontend:** Edit files in `frontend/src/`, changes hot-reload automatically
- **Backend:** Edit files in `backend/app/`, server auto-restarts
- **Desktop:** Edit files in `frontend/electron/`, restart required

## Next Steps

1. Read the main README.md for usage instructions
2. Check the API documentation at http://localhost:8000/docs
3. Try the example macros included
4. Explore the AI assistant features

## Support

If you encounter issues:
1. Check this troubleshooting section
2. Review the main README.md
3. Check GitHub issues
4. Create a new issue with error details

Happy automating! 🤖
