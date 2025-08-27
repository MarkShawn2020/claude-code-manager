#!/bin/bash
# Description: Example template for creating custom statuslines
# =============================================================================
# Custom Statusline Template
# =============================================================================
# This is a template for creating your own custom statusline.
# Copy this file and modify it to create your unique statusline!
#
# To use:
# 1. Copy this file: cp example-custom.sh your-name.sh
# 2. Modify the output format below
# 3. Make executable: chmod +x your-name.sh
# 4. Select it: ccm statusline select your-name
# =============================================================================

# Read JSON input from Claude Code
input=$(cat)

# Extract common values using jq
MODEL=$(echo "$input" | jq -r '.model.display_name // "Claude"')
COST_USD=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir // "~"')
SESSION_ID=$(echo "$input" | jq -r '.session_id // ""')
LINES_ADDED=$(echo "$input" | jq -r '.cost.total_lines_added // 0')
LINES_REMOVED=$(echo "$input" | jq -r '.cost.total_lines_removed // 0')

# Get directory name
DIR_NAME=$(basename "$CURRENT_DIR")

# Format duration (ms to seconds)
DURATION_SEC=$((DURATION_MS / 1000))

# Format cost
COST_STR=$(printf "$%.3f" $COST_USD)

# =============================================================================
# CUSTOMIZE YOUR OUTPUT BELOW
# =============================================================================
# This is where you create your unique statusline format.
# Use ANSI escape codes for colors:
#   \033[31m = Red
#   \033[32m = Green
#   \033[33m = Yellow
#   \033[34m = Blue
#   \033[35m = Magenta
#   \033[36m = Cyan
#   \033[37m = White
#   \033[0m  = Reset
#
# Example: Minimalist style
# echo -e "[\033[35m$MODEL\033[0m] $DIR_NAME | ${DURATION_SEC}s | $COST_STR"
#
# Example: Emoji style
# echo -e "🤖 $MODEL 📁 $DIR_NAME ⏱️ ${DURATION_SEC}s 💰 $COST_STR"
#
# Example: Compact style
# echo -e "$MODEL:$DIR_NAME:$COST_STR"
# =============================================================================

# Your custom format here (modify this line):
echo -e "🎯 \033[36m$MODEL\033[0m » \033[33m$DIR_NAME\033[0m » \033[32m${DURATION_SEC}s\033[0m » \033[31m$COST_STR\033[0m"