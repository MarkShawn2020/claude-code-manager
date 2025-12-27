#!/bin/bash

# Test hook across multiple projects
# Verifies that the hook works regardless of which project Claude Code is running in

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Testing Hook Across Projects"
echo "================================"
echo ""

# Get current execution count
BEFORE_COUNT=$(sqlite3 ~/.claude/db.sql "SELECT COUNT(*) FROM executions" 2>/dev/null || echo "0")

echo "📊 Current total executions: $BEFORE_COUNT"
echo ""

# Test in claude-code-manager project
echo "Testing in claude-code-manager..."
cd /Users/mark/projects/claude-code-manager
node dist/cli.js --version > /dev/null 2>&1
sleep 0.5

# Test in another project (if exists)
if [ -d "/Users/mark/projects/reelvan-web" ]; then
    echo "Testing in reelvan-web..."
    cd /Users/mark/projects/reelvan-web
    # Just trigger any command to fire the hook
    ls > /dev/null 2>&1
    sleep 0.5
fi

# Check if executions increased
AFTER_COUNT=$(sqlite3 ~/.claude/db.sql "SELECT COUNT(*) FROM executions" 2>/dev/null || echo "0")

echo ""
echo "📊 New total executions: $AFTER_COUNT"
echo ""

if [ "$AFTER_COUNT" -gt "$BEFORE_COUNT" ]; then
    echo -e "${GREEN}✓${NC} Hook is working! New executions recorded."
    echo ""
    echo "Recent executions:"
    sqlite3 ~/.claude/db.sql "SELECT datetime(timestamp, 'unixepoch', 'localtime') as time, project_path, tool_name FROM executions ORDER BY timestamp DESC LIMIT 5" 2>/dev/null
    exit 0
else
    echo -e "${RED}✗${NC} Hook may not be working. No new executions recorded."
    echo ""
    echo "Debug info:"
    echo "  Settings file: ~/.claude/settings.json"
    echo "  Hook command: $(cat ~/.claude/settings.json | grep -A 5 PostToolUse | grep command | head -1)"
    echo ""
    echo "Try running: ./scripts/verify-hook.sh"
    exit 1
fi
