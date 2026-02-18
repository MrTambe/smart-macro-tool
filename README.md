# Smart Macro Tool

<p align="center">
  <img src="assets/images/logo.png" alt="Smart Macro Tool Logo" width="200"/>
</p>

<p align="center">
  <strong>AI-Powered Spreadsheet Automation Platform</strong>
</p>

<p align="center">
  <a href="https://github.com/yourusername/smart-macro-tool/stargazers">
    <img src="https://img.shields.io/github/stars/yourusername/smart-macro-tool?style=for-the-badge&logo=github&color=yellow" alt="Stars"/>
  </a>
  <a href="https://github.com/yourusername/smart-macro-tool/network/members">
    <img src="https://img.shields.io/github/forks/yourusername/smart-macro-tool?style=for-the-badge&logo=github&color=blue" alt="Forks"/>
  </a>
  <a href="https://github.com/yourusername/smart-macro-tool/issues">
    <img src="https://img.shields.io/github/issues/yourusername/smart-macro-tool?style=for-the-badge&logo=github&color=red" alt="Issues"/>
  </a>
  <a href="https://github.com/yourusername/smart-macro-tool/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/yourusername/smart-macro-tool?style=for-the-badge&color=green" alt="License"/>
  </a>
</p>

<p align="center">
  <a href="https://react.dev">
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React"/>
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript"/>
  </a>
  <a href="https://fastapi.tiangolo.com">
    <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white&style=flat-square" alt="FastAPI"/>
  </a>
  <a href="https://vitejs.dev">
    <img src="https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white&style=flat-square" alt="Vite"/>
  </a>
  <a href="https://www.electronjs.org">
    <img src="https://img.shields.io/badge/Electron-28.0+-47848F?logo=electron&logoColor=white&style=flat-square" alt="Electron"/>
  </a>
</p>

---

## 🎯 Overview

**Smart Macro Tool** is an intelligent spreadsheet automation platform that combines the power of AI with traditional spreadsheet functionality. Built with Clean Architecture principles, it offers Excel-compatible formulas, AI-powered analysis, and professional-grade data processing capabilities.

### ✨ Key Features

- 🤖 **AI-Powered Analysis** - Intelligent suggestions with review & approve workflow
- 📊 **Excel Compatibility** - Full support for Excel formulas (.xlsx, .xls)
- 🔧 **Clean Architecture** - Modular, testable, and maintainable codebase
- 🎨 **Modern UI** - Beautiful React-based interface with dark mode
- ⚡ **High Performance** - FastAPI backend with WebSocket real-time updates
- 🔄 **Multi-format Support** - Import/Export Excel, CSV, and JSON
- 🌐 **Cross-platform** - Desktop app via Electron
- 🔒 **Security First** - Input validation, safe AI operations

---

## 📸 Screenshots

<p align="center">
  <img src="assets/images/screenshot-dashboard.png" alt="Dashboard" width="80%"/>
  <br/>
  <em>Main Dashboard - Professional spreadsheet interface</em>
</p>

<p align="center">
  <img src="assets/images/screenshot-ai-review.png" alt="AI Review" width="80%"/>
  <br/>
  <em>AI Review & Approve - Intelligent change suggestions</em>
</p>

<p align="center">
  <img src="assets/images/screenshot-formulas.png" alt="Formulas" width="80%"/>
  <br/>
  <em>Excel-compatible formula engine</em>
</p>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.9+
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-macro-tool.git
cd smart-macro-tool

# Install frontend dependencies
cd src/frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Return to root
cd ../..
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:frontend  # Vite dev server
npm run dev:backend   # FastAPI server
```

### Production Build

```bash
# Build frontend
npm run build

# Build desktop app
npm run electron:build

# Build for distribution
npm run dist
```

---

## 🏗️ Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
smart-macro-tool/
├── 📁 src/
│   ├── 📁 frontend/          # React + TypeScript + Electron
│   ├── 📁 backend/           # FastAPI + Python
│   ├── 📁 core/              # Clean Architecture modules
│   └── 📁 shared/            # Shared types & utilities
├── 📁 tests/                 # Test suites
├── 📁 docs/                  # Documentation
├── 📁 assets/                # Static resources
└── 📁 scripts/               # Build & utility scripts
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for blazing-fast builds
- Electron for desktop app
- Tailwind CSS for styling
- AG Grid for spreadsheet functionality
- Zustand for state management
- ReactMarkdown for AI output formatting

**Backend:**
- FastAPI (Python)
- Uvicorn ASGI server
- Pandas for data processing
- OpenPyXL for Excel support
- WebSocket for real-time updates

**AI Integration:**
- Multiple AI provider support (OpenRouter, Ollama, LM Studio)
- Structured AI responses with confidence scoring
- Review & approve workflow for safety

---

## 📖 Documentation

- [Architecture Overview](docs/architecture/CLEAN_ARCHITECTURE_GUIDE.md)
- [AI Review & Approve System](docs/architecture/AI_REVIEW_APPROVE_ARCHITECTURE.md)
- [AI Skills & System Prompt](docs/architecture/AI_SYSTEM_PROMPT.md)
- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/api/README.md) *(coming soon)*

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests
cd src/backend
pytest
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔒 Security

For security issues, please see our [Security Policy](SECURITY.md).

---

## 🙏 Acknowledgments

- [AG Grid](https://www.ag-grid.com/) - Professional spreadsheet component
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

<p align="center">
  Made with ❤️ by the Smart Macro Tool Team
</p>

<p align="center">
  <a href="https://github.com/yourusername/smart-macro-tool">GitHub</a> •
  <a href="https://github.com/yourusername/smart-macro-tool/issues">Issues</a> •
  <a href="https://github.com/yourusername/smart-macro-tool/discussions">Discussions</a>
</p>
