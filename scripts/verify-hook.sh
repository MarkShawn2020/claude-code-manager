#!/bin/bash

# Hook Verification Script
# Checks if Claude Code hook is properly configured

SETTINGS_FILE="$HOME/.claude/settings.json"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 Claude Code Hook Verification"
echo "================================"
echo ""

# Check if settings file exists
if [ ! -f "$SETTINGS_FILE" ]; then
    echo -e "${RED}✗${NC} Settings file not found: $SETTINGS_FILE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Settings file found"

# Extract hook command
HOOK_CMD=$(cat "$SETTINGS_FILE" | grep -A 10 "PostToolUse" | grep "command" | grep "claude-code-manager" | head -1 | sed 's/.*"command": "\(.*\)".*/\1/')

if [ -z "$HOOK_CMD" ]; then
    echo -e "${RED}✗${NC} No claude-code-manager hook found"
    exit 1
fi

echo -e "${GREEN}✓${NC} Hook command found: $HOOK_CMD"
echo ""

# Analyze hook type
if [[ "$HOOK_CMD" == *"npx"* ]]; then
    echo -e "${YELLOW}⚠${NC}  Using npx (old approach)"
    echo "   - May experience cache corruption"
    echo "   - Slower performance"
    echo "   - Consider migrating to direct command"
    echo ""
    echo "   Migration: Change to 'claude-code-manager track'"
    HOOK_STATUS="old"
elif [[ "$HOOK_CMD" == *"/dist/cli.js"* ]]; then
    echo -e "${GREEN}✓${NC} Using local development build"
    echo "   - Perfect for development"
    echo "   - Remember: Production users need different config"
    HOOK_STATUS="dev"
elif [[ "$HOOK_CMD" == "claude-code-manager track"* ]] || [[ "$HOOK_CMD" == "ccm track"* ]]; then
    echo -e "${GREEN}✓${NC} Using direct command (recommended)"
    echo "   - Best performance"
    echo "   - No npx overhead"
    echo "   - Production-ready"
    HOOK_STATUS="production"
else
    echo -e "${YELLOW}⚠${NC}  Unknown hook format: $HOOK_CMD"
    HOOK_STATUS="unknown"
fi

echo ""
echo "Testing hook command..."

# Test the command
if eval "$HOOK_CMD --help" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Hook command executes successfully"
else
    echo -e "${RED}✗${NC} Hook command failed"
    echo "   Try running: $HOOK_CMD --help"
    exit 1
fi

echo ""
echo "================================"
if [ "$HOOK_STATUS" = "production" ] || [ "$HOOK_STATUS" = "dev" ]; then
    echo -e "${GREEN}✓${NC} All checks passed!"
elif [ "$HOOK_STATUS" = "old" ]; then
    echo -e "${YELLOW}⚠${NC}  Hook works but migration recommended"
    echo "   See MIGRATION.md for details"
else
    echo -e "${YELLOW}⚠${NC}  Hook works but may need optimization"
fi
