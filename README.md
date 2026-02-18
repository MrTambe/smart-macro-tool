# Smart Macro Tool

<p align="center">
  <img src="assets/images/logo.png" alt="Smart Macro Tool" width="150"/>
</p>

<p align="center">
  <strong>🤖 AI-Powered Spreadsheet Automation</strong>
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

## ✨ What is Smart Macro Tool?

<p align="center">
  <img src="assets/images/dashboard.png" alt="Dashboard" width="90%"/>
</p>

An **intelligent automation platform** that brings AI power to your spreadsheets. Just describe what you want in plain English, and AI helps you analyze, process, and automate your work.

### 🔥 Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Assistant** | Chat with AI to analyze data, generate insights, and automate tasks |
| 📁 **File Management** | Open, save, and manage Excel, CSV files easily |
| ⚡ **Automation** | Record and replay repetitive tasks as macros |
| 🎯 **Smart Suggestions** | AI recommends improvements for your spreadsheets |
| 🌐 **Multi-AI Support** | Works with Ollama (local), OpenRouter (cloud), LM Studio |

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

---

### Step 2: Start the Application

**Option A: Desktop Shortcut (Recommended)**
```
Double-click: scripts\Smart Macro Tool.lnk
```

**Option B: Command Line**
```bash
npm run dev
```

This opens:
- 🌐 **Frontend:** http://localhost:5173
- ⚙️ **Backend:** http://localhost:8000

---

### Step 3: Use the App

1. **Open Browser** → http://localhost:5173
2. **Upload File** → Click folder icon → Select Excel/CSV
3. **Ask AI** → Type in chat panel → Get instant help
4. **Automate** → Record macros → Replay anytime

---

## 📸 Screenshots

<p align="center">
  <img src="assets/images/dashboard.png" alt="Main Dashboard" width="90%"/>
  <br/><em>Main Dashboard</em>
</p>

<p align="center">
  <img src="assets/images/ai-review.png" alt="AI Review" width="90%"/>
  <br/><em>AI Review & Approve</em>
</p>

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

## 📁 Project Structure

```
smart-macro-tool/
├── src/
│   ├── frontend/           # React + Electron + TypeScript
│   │   ├── src/
│   │   │   ├── components/   # UI Components
│   │   │   ├── services/     # AI Services
│   │   │   └── store/        # State Management
│   │   └── package.json
│   │
│   ├── backend/           # FastAPI Python
│   │   ├── app/
│   │   │   ├── api/       # REST Endpoints
│   │   │   ├── core/      # AI Prompts
│   │   │   └── services/  # Business Logic
│   │   └── requirements.txt
│   │
│   └── core/              # Clean Architecture
│
├── assets/
│   └── demo/samples/      # Sample spreadsheets
│
├── scripts/
│   ├── setup-windows.ps1  # Auto-setup
│   └── Smart Macro Tool.lnk  # Desktop shortcut
│
└── README.md
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
