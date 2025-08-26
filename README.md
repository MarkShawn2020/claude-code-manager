# Claude Code Manager (CCM)

> Supercharge your Claude Code workflow with Git worktrees, real-time monitoring, and analytics

[![NPM Version](https://img.shields.io/npm/v/claude-code-manager)](https://www.npmjs.com/package/claude-code-manager)
[![License](https://img.shields.io/npm/l/claude-code-manager)](LICENSE)

## What is CCM?

Claude Code Manager is a professional CLI toolkit that transforms how you work with Claude Code. It provides seamless Git worktree management for parallel feature development, real-time session monitoring, and comprehensive usage analytics—all with zero configuration.

## Key Features

### 🌳 **Git Worktree Workflow**
Create isolated feature branches that Claude Code can work on independently, enabling true parallel development without context switching.

### 📊 **Interactive Analytics Dashboard** 
Web-based dashboard with D3.js visualizations for token usage, costs, and model performance metrics.

### 🔍 **Real-time Session Monitor**
htop-style terminal UI showing active Claude Code tasks in a hierarchical view.

### 💾 **Automatic Tracking**
Zero-config setup via PostInstall hooks—tracks all tool executions automatically.

## Installation

```bash
# Using npm
npm install -g claude-code-manager

# Using pnpm (recommended)
pnpm add -g claude-code-manager

# Using yarn
yarn global add claude-code-manager
```

## Quick Start

```bash
# Initialize tracking (auto-configured on install)
ccm init

# Create a feature branch with worktree
ccm feat add payment-api

# Open interactive dashboard
ccm dashboard

# Monitor active sessions
ccm monitor
```

## Core Commands

### `ccm feat` - Feature Branch Management

Manage parallel development with Git worktrees:

```bash
ccm feat add <name>           # Create worktree in .feats/
ccm feat add <name> --parent  # Create in parent directory  
ccm feat list                 # Interactive worktree manager
ccm feat merge                # Merge completed features
```

**Status Indicators:**
- `✎` Uncommitted changes
- `↑N` Commits ahead of main
- `↓N` Commits behind main
- `✓` Fully merged

### `ccm dashboard` - Analytics Dashboard

Interactive web dashboard for usage visualization:

```bash
ccm dashboard               # Open dashboard
ccm dashboard --refresh     # Force data refresh
ccm dashboard --export json # Export analytics
```

### `ccm monitor` - Real-time Monitor

Terminal UI for active Claude Code sessions:

```bash
ccm monitor  # Launch monitor (Tab: filter, Space: expand, Q: quit)
```

### `ccm stat` - Session Statistics

View and analyze Claude Code sessions:

```bash
ccm stat --analyzer     # Web-based timeline visualization
ccm stat --current      # Current project only
ccm stat --output-path  # Export session data
```

### `ccm memory` - Memory Discovery

Find all CLAUDE.md files across your system:

```bash
ccm memory              # Show with preview
ccm memory --paths-only # List paths only
ccm memory --full       # Full content display
```

## Additional Commands

| Command | Description |
|---------|-------------|
| `ccm usage` | Token usage and cost reports |
| `ccm backup` | Backup Claude configuration |
| `ccm slim` | Clean old project entries |
| `ccm track` | Manual execution tracking |
| `ccm init --check` | Verify setup status |

## How It Works

1. **Automatic Tracking**: PostInstall hooks configure Claude Code to track all tool executions
2. **Local Storage**: Data stored in `~/.claude/db.sql` for privacy and performance
3. **Git Worktrees**: Isolated branches for parallel feature development
4. **Real-time Analysis**: Monitor and analyze sessions as they happen

## Data Storage

- **Database**: `~/.claude/db.sql` - Execution tracking
- **Settings**: `~/.claude/settings.json` - Hook configuration
- **Worktrees**: `.feats/` - Feature branch checkouts
- **Cache**: `.data/usage.json` - Usage metrics (1-hour TTL)

## Development

```bash
# Clone project
git clone https://github.com/markshawn2020/claude-code-manager
cd claude-code-manager

# Install dependencies
pnpm install

# Build project
pnpm build

# Link for development
pnpm link --global
```

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Links

- [GitHub Project](https://github.com/markshawn2020/claude-code-manager)
- [NPM Package](https://www.npmjs.com/package/claude-code-manager)
- [Issue Tracker](https://github.com/markshawn2020/claude-code-manager/issues)

---

<p align="center">Built with ❤️ for the Claude Code community</p>