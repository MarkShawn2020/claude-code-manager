#!/bin/bash
# Description: Full-featured statusline with comprehensive metrics and daily tracking
# =============================================================================
# Claude Code Custom Statusline
# =============================================================================
# Author: Mark Shawn (https://github.com/markshawn2020)
# Community: Vibe Genius
# Version: 1.3.0
# Date: 2025-11-13
# 
# Description:
#   A comprehensive statusline for Claude Code that displays:
#   - Current time and cost tracking (session, daily, monthly)
#   - Working directory and git branch
#   - Context window usage with progress bars
#   - Thinking mode status
#   - Model information
#
# Features:
#   ✓ Multi-level cost tracking (session, daily, monthly)
#   ✓ Git branch awareness
#   ✓ Code changes statistics (lines added/removed)
#   ✓ Stacked context visualization (like /context command)
#   ✓ Context breakdown: System, Memory, Messages, Free space
#   ✓ Color-coded context warnings (green/yellow/red)
#   ✓ Thinking mode indicator (💭 when enabled)
#   ✓ Beautiful ANSI color formatting
#
# Installation:
#   1. Save this script to ~/.claude/statusline.sh
#   2. Make it executable: chmod +x ~/.claude/statusline.sh
#   3. Add to ~/.claude/settings.json:
#      {
#        "statusLine": {
#          "type": "command",
#          "command": "~/.claude/statusline.sh",
#          "padding": 0
#        }
#      }
#
# =============================================================================

# Read JSON input
input=$(cat)

# Extract values using jq
DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
COST_USD=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
MODEL=$(echo "$input" | jq -r '.model.display_name // "Claude"')
CURRENT_DIR=$(echo "$input" | jq -r '.workspace.current_dir // "~"')
SESSION_ID=$(echo "$input" | jq -r '.session_id // ""')
LINES_ADDED=$(echo "$input" | jq -r '.cost.total_lines_added // 0')
LINES_REMOVED=$(echo "$input" | jq -r '.cost.total_lines_removed // 0')
TRANSCRIPT_PATH=$(echo "$input" | jq -r '.transcript_path // ""')

# Check if thinking mode is enabled by reading settings.json
SETTINGS_FILE="$HOME/.claude/settings.json"
THINKING_ENABLED="false"
if [ -f "$SETTINGS_FILE" ]; then
    THINKING_ENABLED=$(jq -r '.alwaysThinkingEnabled // false' "$SETTINGS_FILE" 2>/dev/null || echo "false")
fi

# Get current time
CURRENT_TIME=$(date +"%H:%M:%S")

# Daily cost tracking file
TODAY=$(date +"%Y-%m-%d")
COST_FILE="$HOME/.claude/.daily_costs"
COST_SESSIONS_FILE="$HOME/.claude/.daily_sessions"

# Initialize or update daily cost
if [ -n "$SESSION_ID" ]; then
    # Check if this session has been tracked today
    if [ -f "$COST_SESSIONS_FILE" ]; then
        SESSION_TRACKED=$(grep "^$TODAY:$SESSION_ID:" "$COST_SESSIONS_FILE" 2>/dev/null | cut -d: -f3)
    else
        SESSION_TRACKED="0"
    fi
    
    # Calculate new cost for this session
    SESSION_COST_DIFF=$(echo "$COST_USD - ${SESSION_TRACKED:-0}" | bc 2>/dev/null || echo "0")
    
    # Update session tracking
    if [ "$SESSION_COST_DIFF" != "0" ] && [ "$SESSION_COST_DIFF" != "0.000" ]; then
        # Update session record
        grep -v "^$TODAY:$SESSION_ID:" "$COST_SESSIONS_FILE" 2>/dev/null > "$COST_SESSIONS_FILE.tmp" || true
        echo "$TODAY:$SESSION_ID:$COST_USD" >> "$COST_SESSIONS_FILE.tmp"
        mv "$COST_SESSIONS_FILE.tmp" "$COST_SESSIONS_FILE" 2>/dev/null || true
        
        # Update daily total
        if [ -f "$COST_FILE" ]; then
            DAILY_COST=$(grep "^$TODAY:" "$COST_FILE" 2>/dev/null | cut -d: -f2 || echo "0")
        else
            DAILY_COST="0"
        fi
        NEW_DAILY_COST=$(echo "$DAILY_COST + $SESSION_COST_DIFF" | bc 2>/dev/null || echo "0")
        grep -v "^$TODAY:" "$COST_FILE" 2>/dev/null > "$COST_FILE.tmp" || true
        echo "$TODAY:$NEW_DAILY_COST" >> "$COST_FILE.tmp"
        mv "$COST_FILE.tmp" "$COST_FILE" 2>/dev/null || true
    fi
fi

# Read daily cost
if [ -f "$COST_FILE" ]; then
    DAILY_COST=$(grep "^$TODAY:" "$COST_FILE" 2>/dev/null | cut -d: -f2 || echo "0")
else
    DAILY_COST="0"
fi

# Calculate monthly cost (current month)
CURRENT_MONTH=$(date +"%Y-%m")
MONTHLY_COST="0"
if [ -f "$COST_FILE" ]; then
    MONTHLY_COST=$(grep "^$CURRENT_MONTH" "$COST_FILE" 2>/dev/null | cut -d: -f2 | awk '{sum+=$1} END {print sum}' || echo "0")
fi

# Format costs
SESSION_COST_STR=$(printf "$%.2f" $COST_USD 2>/dev/null || echo "$0.00")
DAILY_COST_STR=$(printf "$%.2f" $DAILY_COST 2>/dev/null || echo "$0.00")
MONTHLY_COST_STR=$(printf "$%.2f" $MONTHLY_COST 2>/dev/null || echo "$0.00")

# Get directory name (basename)
DIR_NAME=$(basename "$CURRENT_DIR")

# Get git branch if in a git repo
GIT_BRANCH=""
if [ -d "$CURRENT_DIR/.git" ] || git -C "$CURRENT_DIR" rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git -C "$CURRENT_DIR" branch --show-current 2>/dev/null)
    if [ -n "$BRANCH" ]; then
        GIT_BRANCH=" \033[91m(\033[0m\033[91m$BRANCH\033[0m\033[91m)\033[0m"
    fi
fi

# Calculate context breakdown from transcript
calculate_context_breakdown() {
    local transcript_path=$1

    # Check if transcript exists
    if [ ! -f "$transcript_path" ]; then
        echo "0:0:0:0"
        return
    fi

    # Track metrics
    local total_context=0
    local system_mem_base=0  # System + Memory (from first message)
    local most_recent_timestamp=""
    local first_message=true

    while IFS= read -r line; do
        local is_sidechain=$(echo "$line" | jq -r '.isSidechain // false')
        local is_error=$(echo "$line" | jq -r '.isApiErrorMessage // false')
        local timestamp=$(echo "$line" | jq -r '.timestamp // ""')
        local has_usage=$(echo "$line" | jq -r '.message.usage.input_tokens // null')

        if [ "$is_sidechain" = "false" ] && [ "$is_error" = "false" ] && [ -n "$timestamp" ] && [ "$has_usage" != "null" ]; then
            local input=$(echo "$line" | jq -r '.message.usage.input_tokens // 0')
            local cache_read=$(echo "$line" | jq -r '.message.usage.cache_read_input_tokens // 0')
            local cache_create=$(echo "$line" | jq -r '.message.usage.cache_creation_input_tokens // 0')

            # First message: base includes system + tools + memory (no conversation history yet)
            if [ "$first_message" = "true" ]; then
                system_mem_base=$((input + cache_read + cache_create))
                first_message=false
            fi

            # Track most recent for total context
            if [ -z "$most_recent_timestamp" ] || [ "$timestamp" \> "$most_recent_timestamp" ]; then
                most_recent_timestamp="$timestamp"
                total_context=$((input + cache_read + cache_create))
            fi
        fi
    done < "$transcript_path"

    # Messages = conversation history = total - (system + memory)
    local messages_tokens=$((total_context - system_mem_base))
    if [ $messages_tokens -lt 0 ]; then
        messages_tokens=0
    fi

    # Estimate breakdown (system+tools ≈ 20k, rest is memory from base)
    local system_tokens=20000
    local memory_tokens=$((system_mem_base - system_tokens))
    if [ $memory_tokens -lt 0 ]; then
        memory_tokens=0
    fi

    # Return: total:system:memory:messages
    echo "$total_context:$system_tokens:$memory_tokens:$messages_tokens"
}

# Generate stacked context bar (like /context visualization)
generate_stacked_context_bar() {
    local total=$1
    local system=$2
    local memory=$3
    local messages=$4
    local limit=200000
    local bar_width=10

    # Calculate free space
    local free=$((limit - total))
    if [ $free -lt 0 ]; then
        free=0
    fi

    # Calculate segments (in characters)
    local sys_chars=$(echo "scale=0; ($system * $bar_width) / $limit" | bc 2>/dev/null || echo "0")
    local mem_chars=$(echo "scale=0; ($memory * $bar_width) / $limit" | bc 2>/dev/null || echo "0")
    local msg_chars=$(echo "scale=0; ($messages * $bar_width) / $limit" | bc 2>/dev/null || echo "0")
    local used_chars=$((sys_chars + mem_chars + msg_chars))
    local free_chars=$((bar_width - used_chars))

    # Ensure we don't overflow
    if [ $free_chars -lt 0 ]; then
        free_chars=0
    fi

    # Build stacked bar
    local bar="["

    # System segment (gray/purple)
    local i
    for ((i=0; i<sys_chars; i++)); do
        bar+="\033[90m⛁\033[0m"  # Dark gray ⛁
    done

    # Memory segment (orange)
    for ((i=0; i<mem_chars; i++)); do
        bar+="\033[38;5;208m▓\033[0m"  # Orange ▓
    done

    # Messages segment (purple)
    for ((i=0; i<msg_chars; i++)); do
        bar+="\033[35m▓\033[0m"  # Magenta ▓
    done

    # Free space segment (light gray)
    for ((i=0; i<free_chars; i++)); do
        bar+="\033[37m░\033[0m"  # Light gray ░
    done

    bar+="]"

    # Calculate percentage and format tokens
    local percentage=$(echo "scale=0; ($total * 100) / $limit" | bc 2>/dev/null || echo "0")
    local total_k=$(echo "scale=0; $total / 1000" | bc 2>/dev/null || echo "0")

    # Color code percentage
    local pct_color="\033[92m"  # Green
    if [ $percentage -ge 80 ]; then
        pct_color="\033[91m"  # Red
    elif [ $percentage -ge 60 ]; then
        pct_color="\033[93m"  # Yellow
    fi

    # Return formatted bar with stats
    printf "%s ${pct_color}%d%%\033[0m \033[90m(200k)\033[0m" "$bar" "$percentage"
}

# Format duration (convert ms to human-readable)
format_duration() {
    local ms=$1
    local seconds=$((ms / 1000))
    local minutes=$((seconds / 60))
    local hours=$((minutes / 60))

    if [ $hours -gt 0 ]; then
        printf "%dh %dm" $hours $((minutes % 60))
    elif [ $minutes -gt 0 ]; then
        printf "%dm %ds" $minutes $((seconds % 60))
    else
        printf "%ds" $seconds
    fi
}

DURATION_STR=$(format_duration $DURATION_MS)

# Format cost with proper decimal places
COST_STR=$(printf "$%.3f" $COST_USD)

# Format lines changes
if [ "$LINES_ADDED" -gt 0 ] || [ "$LINES_REMOVED" -gt 0 ]; then
    LINES_STR=" 📊 \033[92m+$LINES_ADDED\033[0m/\033[91m-$LINES_REMOVED\033[0m"
else
    LINES_STR=""
fi

# Calculate context breakdown and visualization
CONTEXT_STR=""
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    # Get context breakdown: total:system:memory:messages
    CONTEXT_BREAKDOWN=$(calculate_context_breakdown "$TRANSCRIPT_PATH")

    # Parse breakdown
    TOTAL_CONTEXT=$(echo "$CONTEXT_BREAKDOWN" | cut -d: -f1)
    SYSTEM_TOKENS=$(echo "$CONTEXT_BREAKDOWN" | cut -d: -f2)
    MEMORY_TOKENS=$(echo "$CONTEXT_BREAKDOWN" | cut -d: -f3)
    MESSAGE_TOKENS=$(echo "$CONTEXT_BREAKDOWN" | cut -d: -f4)

    # Generate stacked visualization
    CONTEXT_BAR=$(generate_stacked_context_bar "$TOTAL_CONTEXT" "$SYSTEM_TOKENS" "$MEMORY_TOKENS" "$MESSAGE_TOKENS")

    # Format context display
    CONTEXT_STR=" $CONTEXT_BAR"
fi

# Format thinking mode indicator (placed after model)
if [ "$THINKING_ENABLED" = "true" ]; then
    THINKING_STR=" \033[93m💭 THINKING\033[0m"
else
    THINKING_STR=" \033[90m💤 NORMAL\033[0m"
fi

# Output with colors (using ANSI escape codes)
# Format: 💥 HH:MM:SS │ directory (branch) │ [Model] │ [⛁▓░░░░] XX% (200k) │ 💭 THINKING / 💤 NORMAL │ S:$X.XX D:$X.XX M:$X.XX
# S = Session, D = Daily, M = Monthly
# Context bar: ⛁=System ▓=Memory/Messages ░=Free
# 💭 THINKING = Thinking mode enabled (bright yellow)
# 💤 NORMAL = Thinking mode disabled (gray)
echo -e "💥 \033[37m$CURRENT_TIME\033[0m \033[36m│\033[0m \033[96m$DIR_NAME\033[0m$GIT_BRANCH \033[36m│\033[0m \033[35m[$MODEL]\033[0m \033[36m│\033[0m$CONTEXT_STR \033[36m│\033[0m$THINKING_STR \033[36m│\033[0m \033[90mS:$SESSION_COST_STR D:$DAILY_COST_STR M:$MONTHLY_COST_STR\033[0m"

# End of statusline script
# Shared with love by Mark Shawn for the Vibe Genius community 💜