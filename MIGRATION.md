# Migration Guide: npx to Direct Command

## What Changed in v2.10.2+

We've improved hook performance and reliability by changing from:
```bash
npx claude-code-manager track
```

to:
```bash
claude-code-manager track
```

## Why This Change?

The `npx` approach had several issues:

1. **Cache Corruption**: npx cache could become corrupted, causing `ENOTEMPTY` errors
2. **Performance**: npx added 100-200ms overhead on every tool execution
3. **Network Checks**: npx contacted npm registry even when package was installed
4. **Reliability**: Failed when offline or with network issues

## Do You Need to Migrate?

**If you're installing fresh**: No action needed. The new `postinstall` script sets everything up correctly.

**If you're upgrading**: The new version will detect and keep your existing hook. You can optionally migrate for better performance.

## Migration Steps

### Option 1: Automatic (Recommended)

```bash
# Reinstall globally
npm uninstall -g claude-code-manager
npm install -g claude-code-manager

# Or with pnpm
pnpm remove -g claude-code-manager
pnpm add -g claude-code-manager
```

The postinstall script will detect the old hook format and you'll have both. The new one will be used.

### Option 2: Manual

Edit `~/.claude/settings.json`:

**Before:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx claude-code-manager track",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**After:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "claude-code-manager track",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Option 3: Clean Setup

```bash
# Remove old hook configuration
# Edit ~/.claude/settings.json and remove the claude-code-manager hook

# Reinstall
npm install -g claude-code-manager

# The postinstall script will add the new hook
```

## Verification

After migrating, verify the hook works:

```bash
# Check your settings
cat ~/.claude/settings.json | grep -A 5 "claude-code-manager"

# Use Claude Code - it should track executions without errors
ccm stat
```

## Troubleshooting

### "command not found: claude-code-manager"

This means the global installation didn't add the binary to PATH.

**Fix:**
```bash
# Check npm global bin directory
npm config get prefix

# The bin should be in: <prefix>/bin (or <prefix>/lib/node_modules/.bin)
# Ensure this is in your PATH

# macOS/Linux: Add to ~/.bashrc or ~/.zshrc
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Still getting npx errors

**Old hook not removed:**
```bash
# Edit ~/.claude/settings.json
# Remove ALL hooks containing "npx claude-code-manager"
# Keep only the new "claude-code-manager track" hook
```

### Performance still slow

```bash
# Verify you're using the direct command, not npx
grep -A 5 "PostToolUse" ~/.claude/settings.json

# Should show: "command": "claude-code-manager track"
# NOT: "command": "npx claude-code-manager track"
```

## Rollback

If you need to rollback to the npx approach:

```bash
# Edit ~/.claude/settings.json
# Change command back to: "npx claude-code-manager track"
```

Note: This is not recommended due to the performance and reliability issues.

## Questions?

Open an issue at: https://github.com/anthropics/claude-code-manager/issues
