# Claude Code Statuslines

Customizable statuslines for Claude Code displaying real-time session metrics, costs, and project information.

## Available Statuslines

| Name | Description | Features | Preview | Authors |
|------|-------------|----------|---------|---------|
| **vibe-genius** | Full-featured statusline | 💥 Time, daily cost, git, duration, cost, code changes | `💥 10:20:43 (today: $6.93) │ project (main) │ ⏱ 45s 💰 $0.123 📊 +156/-23 │ [Opus]` | Mark Shawn |
| **vibe-genius-wind** | Dynamic emoji version | 🎲 Random emoji + all vibe-genius features | `🚀 10:20:43 (today: $6.93) │ project (main) │ ⏱ 45s 💰 $0.123 📊 +156/-23 │ [Opus]` | markShawn2020, 追逐清风 |
| **minimal** | Lightweight | Model, directory, git, cost only | `[Opus] project (main) │ $0.123` | CCM Team |
| **example-custom** | Template | Example for creating custom statuslines | `🎯 Opus » project » 45s » $0.123` | - |

## Quick Start

```bash
# Install
npm install -g claude-code-manager

# Commands
ccm statusline init              # Install default statusline
ccm statusline list              # List all available
ccm statusline select <name>     # Switch statusline
ccm statusline enable            # Activate in Claude Code
ccm statusline test -n <name>    # Test with mock data
```

## Create Custom Statusline

1. Create script in `modules/statusline/your-name.sh`:
```bash
#!/bin/bash
# Description: Your statusline description

input=$(cat)
MODEL=$(echo "$input" | jq -r '.model.display_name // "Claude"')
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
DIR=$(basename "$(echo "$input" | jq -r '.workspace.current_dir // "~"')")

echo "[$MODEL] $DIR - \$$COST"
```

2. Make executable and select:
```bash
chmod +x modules/statusline/your-name.sh
ccm statusline select your-name
```

## Requirements

- **jq** - JSON processor (required)
- **git** - Branch detection (optional)
- **bc** - Arithmetic operations (optional)

## License

ISC © 2024 Claude Code Manager