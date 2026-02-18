# 🤖 Smart Macro Tool

<p align="center">
  <img src="assets/images/dashboard.png" alt="Smart Macro Tool Dashboard" width="100%"/>
</p>

<p align="center">
  <strong>AI-Powered Spreadsheet Automation Desktop App</strong>
</p>

<p align="center">
  <a href="https://github.com/MrTambe/smart-macro-tool/stargazers">
    <img src="https://img.shields.io/github/stars/MrTambe/smart-macro-tool?style=for-the-badge&logo=github&color=yellow" alt="Stars"/>
  </a>
  <a href="https://github.com/MrTambe/smart-macro-tool/network/members">
    <img src="https://img.shields.io/github/forks/MrTambe/smart-macro-tool?style=for-the-badge&logo=github&color=blue" alt="Forks"/>
  </a>
  <a href="https://github.com/MrTambe/smart-macro-tool/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/MrTambe/smart-macro-tool?style=for-the-badge&color=green" alt="License"/>
  </a>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Assistant** | Chat with AI to analyze data, generate insights |
| 📁 **File Management** | Open, save Excel, CSV, JSON files |
| ⚡ **Macros** | Record and replay repetitive tasks |
| 🌐 **Multi-AI** | Works with Ollama, OpenRouter, LM Studio |
| 🖥️ **Desktop App** | Runs as native Windows/Mac/Linux app |

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

**Windows:**

```powershell
# Double-click to run or paste in PowerShell/CMD:
.\scripts\setup-windows.ps1
```

**Manual Install:**

```bash
# Frontend
cd src/frontend
npm install

# Backend  
cd ../backend
pip install -r requirements.txt
```

### Step 2: Start the Application

**Option A: Desktop Shortcut (Recommended)**

```
Double-click: scripts\Smart Macro Tool.bat
```

**Option B: Command Line**

```bash
npm run dev
```

This opens:

- 🌐 Frontend: http://localhost:5173
- ⚙️ Backend: http://localhost:8000

### Step 3: Use the App

1. Open Browser → http://localhost:5173
2. Upload File → Click folder icon → Select Excel/CSV
3. Ask AI → Type in chat panel → Get instant help
4. Automate → Record macros → Replay anytime

---

## 🔧 First Run Setup

### AI Model Download (Automatic)

On first launch, the app automatically downloads an AI model for offline use:

```
🤖 Downloading AI model...
   ⬇️ llama3.2 (700MB)
   ✓ Installing...
   ✓ Ready!
```

**Manual Download (if needed):**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download model
ollama pull llama3.2
```

---

## 🤝 Contributing

1. 🍴 Fork the repo
2. 🌿 Create branch: `git checkout -b feature/your-feature`
3. 📝 Commit: `git commit -m 'feat: add feature'`
4. 🚀 Push: `git push origin feature/your-feature`
5. 🔃 PR: Open Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🙏 Thanks To

- [React](https://react.dev/) - UI Framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python Web Framework
- [Electron](https://www.electronjs.org/) - Desktop App Framework
- [AG Grid](https://www.ag-grid.com/) - Spreadsheet Component
- [Ollama](https://ollama.com/) - Local AI

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/MrTambe">MrTambe</a>
</p>
