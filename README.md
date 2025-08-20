# Claude Code Manager (CCM)

> Professional CLI toolkit for managing Claude Code workflows with Git worktrees, analytics, and real-time monitoring

[![NPM Version](https://img.shields.io/npm/v/claude-code-manager)](https://www.npmjs.com/package/claude-code-manager)
[![License](https://img.shields.io/npm/l/claude-code-manager)](LICENSE)

## ✨ Features

- **🌳 Git Worktree Management** - Streamlined feature branch workflow with `ccm feat`
- **📊 Interactive Analytics** - Web-based usage dashboard with D3.js visualizations
- **🔍 Real-time Monitoring** - htop-style interface for active Claude Code sessions
- **💰 Cost Tracking** - Token usage analysis with model-specific breakdowns
- **📝 Memory Discovery** - Hierarchical view of all CLAUDE.md files across projects
- **🚀 Zero Configuration** - Automatic setup via PostInstall hooks

## 🚀 Quick Start

```bash
# Install globally
npm install -g claude-code-manager

# Initialize tracking
ccm init

# Create a feature branch
ccm feat add my-feature

# View interactive dashboard
ccm dashboard
```

## 📦 Installation

```bash
# NPM
npm install -g claude-code-manager

# PNPM
pnpm add -g claude-code-manager

# Yarn
yarn global add claude-code-manager
```

## 🎯 Core Commands

### `ccm feat` - Git Worktree Management

Manage feature development with isolated Git worktrees for parallel Claude Code sessions.

```bash
# Create new feature worktree
ccm feat add payment-api

# Interactive worktree selector
ccm feat list

# Merge completed features
ccm feat merge
```

**Options:**
- `add <name>` - Create worktree in `.feats/` directory
- `add <name> --parent` - Create in parent directory (Claude docs style)
- `add <name> --path <dir>` - Custom worktree location
- `list` - Interactive worktree manager with delete/enter actions
- `merge` - Merge and archive completed features

### `ccm dashboard` - Usage Analytics

Interactive web dashboard for token usage and cost visualization.

```bash
ccm dashboard                    # Open dashboard
ccm dashboard --refresh          # Force data refresh
ccm dashboard --export data.json # Export analytics
```

**Features:**
- 📈 Time series cost/token charts
- 🥧 Model usage breakdowns
- 📊 Efficiency metrics
- 💾 Export to JSON/CSV

### `ccm monitor` - Real-time Monitoring

Terminal UI for active Claude Code tasks with hierarchical view.

```bash
ccm monitor
```

**Controls:**
- `Tab` - Filter tasks
- `Space` - Expand/collapse
- `Enter` - Show details
- `Q` - Quit

### `ccm stat` - Session Analytics

View and export Claude Code session statistics.

```bash
ccm stat --analyzer        # Web-based timeline
ccm stat --current         # Current project only
ccm stat --output-path ./  # Export data
```

### `ccm memory` - Memory Discovery

Find all CLAUDE.md files across your system.

```bash
ccm memory                 # Show with preview
ccm memory --paths-only    # List paths only
ccm memory --full          # Full content
```

## 🛠️ Additional Commands

| Command | Description |
|---------|-------------|
| `ccm usage` | Token usage reports (daily/monthly) |
| `ccm backup` | Backup Claude configuration |
| `ccm slim` | Clean old project entries |
| `ccm init --check` | Verify setup status |

## 📁 Data Storage

- **Database**: `~/.claude/db.sql` - Execution tracking
- **Settings**: `~/.claude/settings.json` - Hook configuration  
- **Cache**: `.data/usage.json` - Usage data (1-hour TTL)
- **Worktrees**: `.feats/` - Feature branch checkouts

## 🔧 Configuration

CCM automatically configures itself via PostInstall hooks. Manual configuration:

```bash
# Check setup status
ccm init --check

# Force reconfigure
ccm init --force
```

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Clone repository
git clone https://github.com/markshawn2020/claude-code-manager
cd claude-code-manager

# Install dependencies
pnpm install

# Build project
pnpm build

# Run locally
pnpm start
```

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/markshawn2020/claude-code-manager)
- [NPM Package](https://www.npmjs.com/package/claude-code-manager)
- [Issue Tracker](https://github.com/markshawn2020/claude-code-manager/issues)

---

<p align="center">Built with ❤️ for the Claude Code community</p>