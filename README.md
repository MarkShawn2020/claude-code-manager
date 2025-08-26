# Claude Code Manager

[![NPM Version](https://img.shields.io/npm/v/claude-code-manager)](https://www.npmjs.com/package/claude-code-manager)
[![License](https://img.shields.io/npm/l/claude-code-manager)](LICENSE)
[![Node](https://img.shields.io/node/v/claude-code-manager)](package.json)

**Analytics & workflow automation for Claude Code power users.** Track executions, monitor costs, and manage parallel development with zero configuration.

<div align="center">
  <img src="./assets/demo-2.7.0.png" alt="Claude Code Manager Dashboard" width="100%">
  <br>
  <em><code>ccm dashboard</code> - Real-time analytics with hot-reload support</em>
</div>

## Quick Start

```bash
npm install -g claude-code-manager
ccm init                    # Auto-setup tracking
ccm dashboard --hot-reload   # Open analytics dashboard
```

## Key Features

### 📊 Analytics Dashboard
Interactive web dashboard with cost tracking, usage metrics, and execution heatmaps. Features hot-reload for real-time updates.

```bash
ccm dashboard               # Open dashboard
ccm dashboard --hot-reload  # Auto-refresh on data changes
```

### 🌳 Git Worktrees
Manage parallel feature development without context switching.

```bash
ccm feat add payment-api    # Create feature branch
ccm feat list              # Interactive branch manager
ccm feat merge             # Merge completed features
```

### 🔍 Real-Time Monitor
Live terminal UI showing active Claude sessions, hierarchical task views, and execution status.

```bash
ccm monitor                # Tab: filter, Space: expand, Q: quit
```

### 💾 Zero-Config Tracking
Automatic execution tracking via PostInstall hooks. All tool usage is captured in SQLite database.

```bash
ccm init                   # Setup automatic tracking
ccm stat                   # View session statistics
```

### 🧠 Memory Discovery
Find and manage all CLAUDE.md configuration files across your projects.

```bash
ccm memory                 # Show with preview
ccm memory --full          # Display full content
```

## Installation

### Package Managers

```bash
# npm
npm install -g claude-code-manager

# pnpm (recommended)
pnpm add -g claude-code-manager

# yarn
yarn global add claude-code-manager
```

### Development Setup

```bash
git clone https://github.com/markshawn2020/claude-code-manager
cd claude-code-manager
pnpm install
pnpm build
pnpm link --global
```

## Command Reference

| Command | Description | Key Options |
|---------|-------------|-------------|
| `dashboard` | Web analytics dashboard | `--hot-reload`, `--skip-usage` |
| `feat` | Git worktree management | `add`, `list`, `merge` |
| `monitor` | Real-time session monitor | Interactive UI |
| `stat` | Session statistics | `--current`, `--project` |
| `memory` | Memory file discovery | `--paths-only`, `--full` |
| `usage` | Token usage reports | `--json`, `--csv` |
| `init` | Setup tracking | Auto-configures hooks |
| `backup` | Backup configurations | `--output` |
| `slim` | Clean old entries | `--days`, `--force` |

## Data Storage

| Location | Purpose |
|----------|---------|
| `~/.claude/db.sql` | Execution tracking database |
| `~/.claude/settings.json` | Hook configuration |
| `.feats/` | Feature branch worktrees |
| `.data/usage.json` | Usage cache (1hr TTL) |

## Requirements

- Node.js ≥ 18.0.0
- Git (for worktree features)
- Claude Code CLI

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repository
2. Create feature branch (`ccm feat add your-feature`)
3. Commit changes with conventional commits
4. Push to branch
5. Open Pull Request

## License

ISC © 2024 - See [LICENSE](LICENSE) for details

## Links

- [NPM Package](https://www.npmjs.com/package/claude-code-manager)
- [GitHub Repository](https://github.com/markshawn2020/claude-code-manager)
- [Issue Tracker](https://github.com/markshawn2020/claude-code-manager/issues)
- [Changelog](CHANGELOG.md)

---

<div align="center">
  <sub>Built for the Claude Code community</sub>
  <br>
  <sub>⭐ Star this repo if you find it useful!</sub>
</div>