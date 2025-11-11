# Claude Code Statuslines

Customizable statuslines for Claude Code displaying real-time session metrics, costs, and project information.

## Available Statuslines

### Bash Statuslines (Simple & Fast)

| Name | Description | Features | Preview | Authors |
|------|-------------|----------|---------|---------|
| **vibe-genius** | Full-featured statusline | 💥 Time, daily cost, git, context, code changes | `💥 10:20:43 (today: $6.93) │ project (main) │ ⏱ 45s 💰 $0.123 📊 +156/-23 │ 🧠 [⛁⛁▓▓░░] 62% (123k/200k) │ [Opus]` | Mark Shawn |
| **vibe-genius-wind** | Dynamic emoji version | 🎲 Random emoji + all vibe-genius features | `🚀 10:20:43 (today: $6.93) │ project (main) │ ⏱ 45s 💰 $0.123 📊 +156/-23 │ 🧠 [⛁⛁▓▓░░] 62% (123k/200k) │ [Opus]` | markShawn2020, 追逐清风 |
| **minimal** | Lightweight | Model, directory, git, cost only | `[Opus] project (main) │ $0.123` | CCM Team |
| **example-custom** | Template | Example for creating custom statuslines | `🎯 Opus » project » 45s » $0.123` | - |

### ccstatusline (Advanced & Configurable)

| Name | Description | Features | Preview | Authors |
|------|-------------|----------|---------|---------|
| **ccstatusline** | Interactive TUI configurator | ⚡ Powerline mode, 20+ widgets, themes, full customization | `⚡ Claude 3.5 Sonnet ❯ main ❯ Ctx: 18.6k ❯ Session: 2h 15m ❯ $1.23` | [sirmalloc](https://github.com/sirmalloc/ccstatusline) |

🎨 **ccstatusline** provides:
- Interactive TUI for visual configuration
- 20+ built-in widgets (Model, Git, Tokens, Context, Block Timer, Session Cost, etc.)
- Powerline mode with beautiful arrow separators
- Multiple pre-configured themes
- Custom command widgets
- Multi-line statuslines
- See [third-parties/ccstatusline](../../third-parties/ccstatusline/README.md) for full documentation

## Quick Start

### Option 1: Bash Statuslines (Recommended for Simplicity)

```bash
# Install CCM
npm install -g claude-code-manager

# Use CCM commands
ccm statusline init              # Install default statusline
ccm statusline list              # List all available
ccm statusline select <name>     # Switch statusline (vibe-genius, minimal, etc.)
ccm statusline enable            # Activate in Claude Code
ccm statusline test -n <name>    # Test with mock data
```

### Option 2: ccstatusline (Recommended for Customization)

```bash
# Run interactive TUI configurator
npx ccstatusline@latest

# Or with Bun (faster)
bunx ccstatusline@latest

# The TUI allows you to:
# - Add/remove/reorder widgets visually
# - Customize colors and styling
# - Enable Powerline mode
# - Install directly to Claude Code settings
```

## Switching Between Statuslines

### Method 1: Using CCM (for Bash statuslines)

```bash
# Switch to vibe-genius
ccm statusline select vibe-genius

# Switch to minimal
ccm statusline select minimal
```

### Method 2: Manual Configuration (for ccstatusline or custom)

Edit `~/.claude/settings.json`:

```json
{
  "statusLine": "npx ccstatusline@latest"
}
```

Or for bash statuslines:

```json
{
  "statusLine": "/path/to/claude-code-manager/modules/statusline/vibe-genius.sh"
}
```

### Method 3: Using ccstatusline TUI

Run `npx ccstatusline@latest` and select **"Install to Claude Code"** from the menu to automatically update your settings.

## Comparison: Bash vs ccstatusline

| Feature | Bash Statuslines | ccstatusline |
|---------|-----------------|--------------|
| **Setup** | Simple shell scripts | Interactive TUI |
| **Performance** | ⚡ Ultra-fast (native bash) | Fast (Node.js/Bun) |
| **Customization** | Edit shell script | Visual configurator |
| **Dependencies** | jq, bc, git | Node.js or Bun |
| **Widgets** | Limited (built-in only) | 20+ widgets + custom commands |
| **Themes** | Manual color editing | Built-in themes + full customization |
| **Powerline** | Not supported | ✅ Full support with auto-alignment |
| **Multi-line** | Single line only | ✅ Unlimited lines |
| **Context Viz** | Stacked bar (basic) | Multiple formats + toggle modes |
| **Configuration** | Code editing | GUI + saved configs |
| **Best For** | Quick setup, minimal overhead | Advanced users, visual customization |

### Which Should You Choose?

**Choose Bash Statuslines if:**
- ✅ You want the fastest possible performance
- ✅ You prefer simple, readable shell scripts
- ✅ You don't need Powerline mode or fancy styling
- ✅ You want minimal dependencies (just jq, bc)
- ✅ You're comfortable editing bash scripts

**Choose ccstatusline if:**
- ✅ You want visual configuration via TUI
- ✅ You need Powerline mode with arrow separators
- ✅ You want to configure multiple status lines
- ✅ You prefer pre-built themes
- ✅ You need advanced widgets (Block Timer, Custom Commands, etc.)
- ✅ You want to frequently change your statusline appearance

**Hybrid Approach:**
You can use both! Start with `vibe-genius` for daily use, and switch to `ccstatusline` when you need specific widgets or visual customization.

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

### For Bash Statuslines
- **jq** - JSON processor (required)
- **git** - Branch detection (optional)
- **bc** - Arithmetic operations (optional)

### For ccstatusline
- **Node.js 18+** or **Bun 1.0+**
- **Powerline fonts** (optional, for Powerline mode)

## Examples

### Example 1: Quick Setup with vibe-genius

```bash
# Install and activate vibe-genius
ccm statusline select vibe-genius
ccm statusline enable

# Result:
# 💥 10:20:43 (today: $6.93) │ project (main) │ ⏱ 45s 💰 $0.123 📊 +156/-23 │ 🧠 [⛁⛁▓▓░░] 62% (123k/200k) │ [Opus]
```

### Example 2: Configure ccstatusline with Powerline

```bash
# Launch TUI
npx ccstatusline@latest

# In the TUI:
# 1. Press 'p' to enable Powerline mode
# 2. Add widgets: Model, Git Branch, Context %, Session Cost
# 3. Customize colors
# 4. Press 'i' to install to Claude Code

# Result:
# ⚡ Claude 3.5 Sonnet ❯ main ❯ Ctx: 18.6k ❯ $1.23
```

### Example 3: Create Custom Hybrid

Combine bash statusline with ccstatusline widgets:

```json
{
  "statusLine": "~/.claude/my-custom.sh"
}
```

In `my-custom.sh`, call ccstatusline for specific widgets:

```bash
#!/bin/bash
input=$(cat)

# Use ccstatusline for context widget
CONTEXT=$(echo "$input" | npx ccstatusline@latest --widget context-percentage)

# Use bash for custom parts
TIME=$(date +"%H:%M:%S")
MODEL=$(echo "$input" | jq -r '.model.display_name')

echo "⚡ $TIME │ $MODEL │ $CONTEXT"
```

### Example 4: Switch Between Configurations

```bash
# Morning: Use minimal for focus
ccm statusline select minimal

# Afternoon: Switch to vibe-genius for detailed metrics
ccm statusline select vibe-genius

# Evening: Try ccstatusline with Powerline theme
npx ccstatusline@latest  # Configure and install
```

## Related Projects

- [ccstatusline](https://github.com/sirmalloc/ccstatusline) - Advanced statusline formatter with TUI
- [ccusage](https://github.com/ryoppippi/ccusage) - Claude Code usage metrics tracker
- [tweakcc](https://github.com/Piebald-AI/tweakcc) - Customize Claude Code themes and settings

## License

ISC © 2024 Claude Code Manager