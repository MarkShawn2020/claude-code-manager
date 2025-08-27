# Claude Code Manager

[![NPM Version](https://img.shields.io/npm/v/claude-code-manager)](https://www.npmjs.com/package/claude-code-manager)
[![License](https://img.shields.io/npm/l/claude-code-manager)](LICENSE)
[![Node](https://img.shields.io/node/v/claude-code-manager)](package.json)

**Analytics & workflow automation for Claude Code power users.** Track executions, monitor costs, and streamline AI-assisted development with zero configuration.

<div align="center">
  <img src="./assets/demo-2.7.0.png" alt="Claude Code Manager Dashboard" width="100%">
  <br>
  <em>Real-time analytics dashboard with execution tracking and cost monitoring</em>
</div>

## Quick Start

```bash
npm install -g claude-code-manager
ccm init                    # Auto-setup tracking
ccm dashboard --hot-reload  # Open analytics dashboard
```

## Features

### 📊 Analytics Dashboard
Real-time web dashboard with cost tracking, usage metrics, and execution heatmaps.

```bash
ccm dashboard               # Open dashboard
ccm dashboard --hot-reload  # Auto-refresh on data changes
ccm dashboard --export data.json  # Export analytics data
```

### 🎨 Custom Statusline
Install and manage custom statuslines for Claude Code with real-time session metrics.

```bash
ccm statusline init         # Install statusline script
ccm statusline enable       # Activate in Claude Code
ccm statusline test         # Preview with mock data
ccm statusline status       # Check configuration
```

### 🌳 Git Worktrees
Manage parallel feature development without context switching.

```bash
ccm feat add payment-api    # Create feature branch & worktree
ccm feat list              # Interactive branch manager
ccm feat merge             # Merge completed features
ccm feat clean             # Remove merged worktrees
```

### 🔍 Real-Time Monitor
Live terminal UI showing active Claude sessions with hierarchical task views.

```bash
ccm monitor                # Interactive monitor (Tab: filter, Space: expand, Q: quit)
ccm monitor --filter active --order modified
```

### 🧠 Memory Discovery
Find and manage all CLAUDE.md configuration files across your projects.

```bash
ccm memory                 # Show all memory files
ccm memory --full          # Display full content
ccm memory --paths-only    # List paths only
```

### 💾 Zero-Config Tracking
Automatic execution tracking via PostToolUse hooks - captures all tool usage in SQLite.

```bash
ccm init                   # Setup automatic tracking
ccm stat                   # View session statistics
ccm stat --analyzer        # Web-based analyzer (redirects to dashboard)
```

## Installation

### Global Installation (Recommended)

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

## Commands

| Command | Description | Key Options |
|---------|-------------|-------------|
| `dashboard` | Web analytics dashboard | `--hot-reload`, `--skip-usage`, `--export` |
| `statusline` | Manage Claude Code statusline | `init`, `enable`, `disable`, `test`, `status` |
| `feat` | Git worktree management | `add`, `list`, `merge`, `clean`, `sync` |
| `monitor` | Real-time session monitor | `--filter`, `--order`, `--refresh-interval` |
| `stat` | Session statistics | `--current`, `--analyzer`, `--output-path` |
| `memory` | Memory file discovery | `--paths-only`, `--full`, `--exclude` |
| `usage` | Token usage reports | `daily`, `monthly`, `session`, `--json` |
| `init` | Setup tracking | `--force`, `--check` |
| `track` | Record execution (hook) | Used by PostToolUse hook |
| `backup` | Backup configurations | Creates timestamped backups |
| `slim` | Clean old entries | `--force`, `--include-current` |

## Data Storage

| Location | Purpose |
|----------|---------|
| `~/.claude/db.sql` | Execution tracking database |
| `~/.claude/settings.json` | Claude Code configuration |
| `~/.claude/statusline.sh` | Custom statusline script |
| `.feats/` | Feature branch worktrees |
| `.data/usage.json` | Usage cache (1hr TTL) |

## Requirements

- Node.js ≥ 18.0.0
- Git (for worktree features)
- Claude Code CLI
- jq (for statusline script)

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