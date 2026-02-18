# Smart Macro Tool

An intelligent automation system for repetitive digital tasks. Built with Electron, React, Python FastAPI, and AI integration.

![Smart Macro Tool](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **File Editor**: Edit spreadsheets (Excel, CSV) and documents (Word) with AI assistance
- **AI Chat Panel**: Interactive AI assistant with voice input/output, requires approval before making changes
- **Macro Recording**: Record and playback keyboard/mouse actions
- **File Explorer**: Browse and manage files with context menu actions
- **Real-time Collaboration**: WebSocket-based updates
- **Privacy-First**: Local AI processing with Ollama support

## Architecture

```
smart-macro-tool/
├── frontend/          # Electron + React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatPanel/       # AI chat interface
│   │   │   ├── SpreadsheetEditor/  # Excel-like editor
│   │   │   ├── MacroPanel/      # Macro recording/playback
│   │   │   ├── FileExplorer/    # File browser
│   │   │   ├── TopBar/          # Menu bar
│   │   │   └── StatusBar/       # Status indicators
│   │   ├── hooks/               # Custom React hooks
│   │   ├── styles/              # Global styles
│   │   └── App.tsx             # Main app component
│   ├── electron/               # Electron main process
│   └── package.json
├── backend/           # Python FastAPI backend
│   ├── app/
│   │   ├── api/        # API routes
│   │   ├── core/       # Config and utils
│   │   └── services/   # Business logic
│   │       ├── ai_service.py
│   │       ├── file_processor.py
│   │       └── macro_engine.py
│   └── requirements.txt
└── package.json       # Root package.json
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- Windows 10/11 (for desktop app)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smart-macro-tool
```

2. **Install dependencies**
```bash
npm run setup
```

3. **Configure AI (Optional)**

Copy the environment file and configure:
```bash
cd backend
cp .env.example .env
```

Edit `.env` to choose your AI provider:
- **Ollama** (default, local): No API key needed, runs offline
- **OpenAI**: Add your API key
- **Anthropic**: Add your API key

4. **Run the application**
```bash
npm run dev
```

This starts:
- Frontend dev server (Electron + React): http://localhost:5173
- Backend API server (FastAPI): http://localhost:8000

## Usage

### Opening Files

1. Use **File > Open** or drag files into the file explorer
2. Supported formats: `.xlsx`, `.xls`, `.csv`, `.docx`, `.doc`
3. Files display in the main editor area

### Working with Spreadsheets

- **Edit cells**: Double-click any cell
- **Format**: Use the toolbar (bold, italic, alignment, etc.)
- **Add rows/columns**: Use the "+" buttons in toolbar
- **Formulas**: Support for Excel formulas
- **Export**: File > Export to save as Excel, CSV, or PDF

### Using AI Assistant

1. Type your request in the chat panel or use voice input (microphone button)
2. AI will analyze your request and suggest actions
3. **Important**: AI always asks for approval before making changes
4. Review the proposed actions and approve/reject each one
5. AI explains what it did after completion

**Example AI commands:**
- "Format column A as currency"
- "Create a summary row with totals"
- "Find and replace 'old' with 'new' in all cells"
- "Sort by column B descending"
- "Record a macro to format headers"

### Recording Macros

1. Click **Record** tab in Macro Panel
2. Click **Start Recording** (red button)
3. Perform actions in the editor
4. Click **Stop Recording**
5. Name your macro and save
6. Play back from the Library tab

### Voice Commands

- Click the microphone button in chat to use voice input
- AI responses can be spoken aloud (TTS)
- Works with Web Speech API (built into browser)

## Development

### Frontend Development

```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run electron:dev # Run Electron in dev mode
```

### Backend Development

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

API documentation available at: http://localhost:8000/docs

### Building Desktop App

```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

The installer will be created in `dist/` directory.

## Configuration

### AI Providers

#### Ollama (Recommended for Privacy)

1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. Start Ollama server: `ollama serve`
4. Update `.env`:
```
AI_PROVIDER=ollama
OLLAMA_MODEL=llama2
```

#### OpenAI

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

#### Anthropic

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key-here
ANTHROPIC_MODEL=claude-instant-1
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+O | Open file |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save as |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+X | Cut |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+F | Find |
| Ctrl+K | Command palette |
| F11 | Full screen |

## Troubleshooting

### Backend not connecting
- Check if port 8000 is available
- Run: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
- Check firewall settings

### AI not responding
- Verify AI service is running (Ollama/OpenAI)
- Check `.env` configuration
- Check backend logs for errors

### Voice input not working
- Ensure browser supports Web Speech API
- Grant microphone permissions
- Use HTTPS or localhost (required for Web Speech API)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/) for desktop app framework
- [React](https://reactjs.org/) for UI library
- [FastAPI](https://fastapi.tiangolo.com/) for backend API
- [AG Grid](https://www.ag-grid.com/) for spreadsheet component
- [Ollama](https://ollama.ai/) for local AI

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

Built with ❤️ by the Smart Macro Team
