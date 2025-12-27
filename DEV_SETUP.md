# Development Setup Guide

## Local Development Hook Configuration

When developing `claude-code-manager` locally, you need to configure Claude Code hooks to use your local build instead of the published npm package.

### Quick Setup

```bash
# Build and configure development hook
pnpm setup:dev-hook
```

This will:
1. Build the TypeScript project
2. Configure `~/.claude/settings.json` to use your local build
3. Remove any conflicting production hooks

### Manual Setup

If you prefer to set up manually:

```bash
# 1. Build the project
pnpm build

# 2. Run the dev setup script
node scripts/setup-dev-hook.js
```

### What Gets Configured

The development hook uses an absolute path to your local build:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /Users/you/projects/claude-code-manager/dist/cli.js track",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Production vs Development

| Environment | Command | Notes |
|-------------|---------|-------|
| **Production** (users) | `claude-code-manager track` | Direct command, fast, no npx overhead |
| **Development** (you) | `node /path/to/dist/cli.js track` | Absolute path to local build |

### Why Not Use npx?

We moved away from `npx claude-code-manager track` for several reasons:

1. **Performance**: npx adds startup overhead on every hook execution
2. **Reliability**: npx cache can become corrupted (ENOTEMPTY errors)
3. **Network**: npx checks npm registry even when package is installed
4. **Simplicity**: Direct command is faster and more predictable

For production users who install globally via `npm install -g claude-code-manager`, the `claude-code-manager` command is automatically added to PATH and works reliably.

### Troubleshooting

**Hook not working?**
```bash
# Verify build exists
ls -l dist/cli.js

# Rebuild and reconfigure
pnpm setup:dev-hook

# Test hook manually
node dist/cli.js track
```

**Want to switch back to production hook?**
```bash
# Manually edit ~/.claude/settings.json
# Change command to: "claude-code-manager track"
```

### Testing Changes

After modifying the code:

```bash
# Rebuild
pnpm build

# No need to reconfigure hook - it uses absolute path
# Your changes will be picked up automatically
```
