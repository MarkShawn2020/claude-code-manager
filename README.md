# Claude Code Manager

[![NPM Version](https://img.shields.io/npm/v/claude-code-manager)](https://www.npmjs.com/package/claude-code-manager)
[![License](https://img.shields.io/npm/l/claude-code-manager)](LICENSE)
[![Node](https://img.shields.io/node/v/claude-code-manager)](package.json)

Professional CLI toolkit for Claude Code power users. Automatic execution tracking, real-time monitoring, and advanced analytics with zero configuration.


![demo](./assets/demo-2.7.0.png)
<center>
`ccm dashboard`
</center>

## ✨ Features

- **🌳 Git Worktrees** - Parallel feature development without context switching
- **📊 Analytics Dashboard** - Interactive web dashboard with cost tracking and usage metrics  
- **🔍 Real-time Monitor** - htop-style terminal UI for active Claude sessions
- **💾 Zero-Config Tracking** - Automatic execution tracking via PostInstall hooks
- **🧠 Memory Discovery** - Find and manage all CLAUDE.md files across projects

## 🚀 Quick Start

```bash
# Install globally
npm install -g claude-code-manager

# Auto-setup tracking (runs on install)
ccm init

# Create feature branch
ccm feat add payment-api

# Open dashboard
ccm dashboard
```

## 📦 Installation

### npm
```bash
npm install -g claude-code-manager
```

### pnpm (recommended)
```bash
pnpm add -g claude-code-manager
```

### yarn
```bash
yarn global add claude-code-manager
```

## 🎯 Core Commands

### Feature Management (`ccm feat`)
Manage parallel development with Git worktrees.

```bash
ccm feat add <name>     # Create worktree in .feats/
ccm feat list          # Interactive worktree manager  
ccm feat merge         # Merge completed features
```

**Status Icons:**
- `✎` Uncommitted changes
- `↑N` Ahead of main
- `↓N` Behind main
- `✓` Fully merged

### Analytics Dashboard (`ccm dashboard`)
Web-based analytics with real-time data visualization.

```bash
ccm dashboard               # Open dashboard
ccm dashboard --refresh     # Force refresh
ccm dashboard --export json # Export data
```

### Real-time Monitor (`ccm monitor`)
Live terminal UI for active Claude sessions.

```bash
ccm monitor  # Tab: filter, Space: expand, Q: quit
```

### Session Statistics (`ccm stat`)
Analyze Claude Code session data.

```bash
ccm stat --analyzer     # Timeline visualization
ccm stat --current      # Current project only
ccm stat --output-path  # Export sessions
```

### Memory Discovery (`ccm memory`)
Find all CLAUDE.md configuration files.

```bash
ccm memory              # Show with preview
ccm memory --paths-only # List paths only
ccm memory --full       # Full content
```

## 📋 All Commands

| Command | Description |
|---------|-------------|
| `init` | Setup automatic tracking |
| `feat` | Git worktree management |
| `dashboard` | Web analytics dashboard |
| `monitor` | Real-time session monitor |
| `stat` | Session statistics |
| `memory` | Memory file discovery |
| `usage` | Token usage reports |
| `backup` | Backup configurations |
| `slim` | Clean old entries |
| `track` | Manual tracking |

## 🗄️ Data Storage

| Location | Purpose |
|----------|---------|
| `~/.claude/db.sql` | Execution tracking database |
| `~/.claude/settings.json` | Hook configuration |
| `.feats/` | Feature branch worktrees |
| `.data/usage.json` | Usage cache (1hr TTL) |

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/markshawn2020/claude-code-manager
cd claude-code-manager

# Install dependencies
pnpm install

# Build project
pnpm build

# Link for development
pnpm link --global
```

### Requirements
- Node.js ≥ 18.0.0
- Git (for worktree features)
- Claude Code CLI

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

ISC License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/claude-code-manager)
- [GitHub Repository](https://github.com/markshawn2020/claude-code-manager)
- [Issue Tracker](https://github.com/markshawn2020/claude-code-manager/issues)
- [Changelog](CHANGELOG.md)

---

<p align="center">
  Built for the Claude Code community
  <br>
  <sub>Star ⭐ this repo if you find it useful!</sub>
</p>