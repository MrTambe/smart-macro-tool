# Contributing to Smart Macro Tool

First off, thank you for considering contributing to Smart Macro Tool! It's people like you that make this project a great tool for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Accept responsibility for mistakes

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.9+
- **Git**
- **npm** or **yarn**

### Setting Up Development Environment

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/smart-macro-tool.git
cd smart-macro-tool

# 3. Add upstream remote
git remote add upstream https://github.com/original/smart-macro-tool.git

# 4. Install dependencies
# Frontend
cd src/frontend
npm install

# Backend
cd ../backend
pip install -r requirements.txt

# 5. Create a branch for your feature
git checkout -b feature/your-feature-name
```

## 🔄 Development Workflow

### Running the Application

```bash
# Start both frontend and backend
npm run dev

# Or individually:
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:8000
```

### Running Tests

```bash
# Frontend tests
cd src/frontend
npm test

# Backend tests
cd src/backend
pytest

# Run with coverage
pytest --cov=app tests/
```

## 🏗️ Project Structure

```
smart-macro-tool/
├── 📁 src/
│   ├── 📁 frontend/          # React + TypeScript
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/   # React components
│   │   │   ├── 📁 store/        # State management
│   │   │   ├── 📁 services/     # API services
│   │   │   └── 📁 utils/        # Utilities
│   │   └── package.json
│   │
│   ├── 📁 backend/           # Python FastAPI
│   │   ├── 📁 app/
│   │   │   ├── 📁 api/          # API routes
│   │   │   ├── 📁 services/     # Business logic
│   │   │   ├── 📁 core/         # Core modules
│   │   │   └── main.py
│   │   └── requirements.txt
│   │
│   └── 📁 core/              # Clean Architecture
│       └── 📁 ai/               # AI modules
│
├── 📁 tests/                 # Test files
├── 📁 docs/                  # Documentation
└── 📁 scripts/               # Utility scripts
```

## 📝 Coding Standards

### TypeScript/React (Frontend)

- Use **TypeScript** for all new code
- Follow **ESLint** rules (run `npm run lint`)
- Use **functional components** with hooks
- Use **Zustand** for state management
- Component naming: `PascalCase` (e.g., `UserProfile.tsx`)
- File naming: Match component name
- Props interface: `{ComponentName}Props`

```typescript
// Good example
interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
};
```

### Python (Backend)

- Follow **PEP 8** style guide
- Use **type hints** for all function signatures
- Maximum line length: 100 characters
- Use **docstrings** for all public functions
- Use **pytest** for testing

```python
# Good example
from typing import List, Optional
from pydantic import BaseModel

class User(BaseModel):
    """User model representing application user."""
    id: str
    name: str
    email: str

async def get_user_by_id(
    user_id: str,
    include_inactive: bool = False
) -> Optional[User]:
    """
    Retrieve user by ID.
    
    Args:
        user_id: Unique identifier for the user
        include_inactive: Whether to include inactive users
        
    Returns:
        User object if found, None otherwise
        
    Raises:
        ValueError: If user_id is empty
    """
    if not user_id:
        raise ValueError("user_id cannot be empty")
    
    # Implementation here
    return await db.users.find_one({"id": user_id})
```

### CSS/Tailwind

- Use **Tailwind CSS** utility classes
- Custom CSS only when necessary
- BEM naming for custom classes
- Responsive design with Tailwind breakpoints

```css
/* Good example */
.spreadsheet-cell {
  @apply px-2 py-1 border border-gray-200;
  @apply hover:bg-gray-50 transition-colors;
}
```

## 💬 Commit Messages

We follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or correcting tests
- **chore**: Build process or auxiliary tool changes

### Examples

```bash
# Feature
feat(ai): add confidence scoring to suggestions

# Bug fix
fix(frontend): resolve grid refresh issue after file load

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(backend): move validators to separate module

# Testing
test(spreadsheet): add unit tests for formula engine
```

### Scope Guidelines

Common scopes:
- `frontend` - Frontend changes
- `backend` - Backend changes
- `ai` - AI-related changes
- `docs` - Documentation
- `tests` - Test files
- `deps` - Dependencies

## 🔄 Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add/update docstrings
   - Update CHANGELOG.md

2. **Run Tests**
   ```bash
   npm test              # Frontend tests
   cd src/backend && pytest  # Backend tests
   ```

3. **Ensure Code Quality**
   ```bash
   npm run lint          # Frontend linting
   npm run typecheck     # TypeScript checks
   ```

4. **Create Pull Request**
   - Use PR template
   - Link related issues
   - Add screenshots for UI changes
   - Request review from maintainers

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No console errors or warnings
- [ ] Branch is up to date with main

## 🐛 Reporting Bugs

### Before Submitting

- Check if issue already exists
- Update to latest version
- Try to isolate the problem

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional Context**
Any other information
```

## 💡 Suggesting Enhancements

### Enhancement Template

```markdown
**Feature Description**
Clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've considered

**Additional Context**
Mockups, examples, or references
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ❓ Questions?

- Join our [Discussions](https://github.com/yourusername/smart-macro-tool/discussions)
- Check [FAQ](docs/FAQ.md)
- Contact maintainers: smart-macro@example.com

## 🙏 Thank You!

Thank you for contributing to Smart Macro Tool! Your efforts help make this project better for everyone.

---

**Happy Coding!** 🚀
