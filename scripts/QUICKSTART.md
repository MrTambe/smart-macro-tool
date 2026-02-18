# Quick Start Guide

## 🚀 Run the App (3 Steps)

### 1. Double-Click to Launch
```
scripts\Smart Macro Tool.bat
```
This automatically:
- ✅ Installs dependencies (if missing)
- ✅ Starts frontend server
- ✅ Starts backend server  
- ✅ Opens browser

### 2. First Time Setup
The app will automatically:
- 📥 Download AI model (llama3.2)
- ⚙️ Create config files

### 3. Use the App
1. Browser opens to http://localhost:5173
2. Upload Excel/CSV file
3. Ask AI in chat panel
4. Done! 🎉

---

## 🔧 Manual Start (If Needed)

### Terminal 1 - Backend:
```bash
cd src/backend
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend:
```bash
cd src/frontend
npm run dev
```

### Open Browser:
```
http://localhost:5173
```

---

## 🛑 Stop the App

1. Close the terminal windows
2. Or press `Ctrl+C` in each terminal

---

## 🤖 AI Setup (Automatic)

On first run, the app downloads an AI model automatically.

**Manual Setup:**
```bash
# Install Ollama
winget install Ollama.Ollama

# Download model
ollama pull llama3.2
```

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8000 in use | Close other apps or change port |
| AI not responding | Check Settings → AI |
| Frontend not loading | Clear browser cache |
| npm error | Delete node_modules and run npm install again |
