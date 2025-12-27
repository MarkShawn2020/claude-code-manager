#!/usr/bin/env node

/**
 * Development-only setup script
 * Configures Claude Code hooks to use local development build
 *
 * Usage: node scripts/setup-dev-hook.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const PROJECT_PATH = path.resolve(__dirname, '..');
const CLI_PATH = path.join(PROJECT_PATH, 'dist', 'cli.js');

console.log('🔧 Setting up development hook...');
console.log('📂 Project path:', PROJECT_PATH);
console.log('🎯 CLI path:', CLI_PATH);

// Check if CLI is built
if (!fs.existsSync(CLI_PATH)) {
  console.error('❌ CLI not found. Please run: pnpm build');
  process.exit(1);
}

// Read settings
let settings = {};
if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
  try {
    settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf8'));
  } catch (error) {
    console.log('⚠️  Could not parse settings, creating new configuration');
  }
}

// Initialize hooks structure
if (!settings.hooks) settings.hooks = {};
if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];

// Remove ALL existing claude-code-manager hooks (including npx versions)
const originalCount = settings.hooks.PostToolUse.length;
settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(hook =>
  !hook.hooks?.some(h =>
    h.command?.includes('claude-code-manager') ||
    h.command?.includes('ccm track')
  )
);
const removedCount = originalCount - settings.hooks.PostToolUse.length;
if (removedCount > 0) {
  console.log(`🗑️  Removed ${removedCount} existing hook(s)`);
}

// Add development hook with absolute path
settings.hooks.PostToolUse.push({
  matcher: '',
  hooks: [
    {
      type: 'command',
      command: `node ${CLI_PATH} track`,
      timeout: 5
    }
  ]
});

// Write settings
fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));

console.log('✅ Development hook configured');
console.log('📍 Settings:', CLAUDE_SETTINGS_PATH);
console.log('💡 Command:', `node ${CLI_PATH} track`);
console.log('');
console.log('⚠️  Remember: This is for local development only');
console.log('📦 For production, users will use: claude-code-manager track');
