#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

function setupAutoTracking() {
  try {
    console.log('🔄 Setting up Claude Code execution tracking...');
    
    // Ensure .claude directory exists
    const claudeDir = path.dirname(CLAUDE_SETTINGS_PATH);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
      console.log('✅ Created ~/.claude directory');
    }

    let settings = {};
    
    // Read existing settings if they exist
    if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
      try {
        const settingsContent = fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf8');
        settings = JSON.parse(settingsContent);
      } catch (error) {
        console.log('⚠️  Could not parse existing settings, will create new configuration');
        settings = {};
      }
    }
    
    // Check if our tracking hook already exists (check for multiple command formats)
    const hooksExist = settings.hooks?.PostToolUse?.some(hook =>
      hook.hooks?.some(h =>
        h.command === 'claude-code-manager track' ||
        h.command === 'ccm track' ||
        h.command === 'npx claude-code-manager track' ||
        h.command.includes('claude-code-manager track')
      )
    );

    if (hooksExist) {
      console.log('✅ Claude Code tracking already configured');
      return;
    }

    // Initialize hooks structure if it doesn't exist
    if (!settings.hooks) {
      settings.hooks = {};
    }
    if (!settings.hooks.PostToolUse) {
      settings.hooks.PostToolUse = [];
    }

    // Add our tracking hook - use direct command instead of npx for better performance
    // and to avoid npx cache issues
    settings.hooks.PostToolUse.push({
      matcher: '',
      hooks: [
        {
          type: 'command',
          command: 'claude-code-manager track',
          timeout: 5
        }
      ]
    });
    
    // Write updated settings
    fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    
    console.log('✅ Added execution tracking to Claude Code settings');
    console.log('📍 Location:', CLAUDE_SETTINGS_PATH);
    console.log('🎉 Setup complete! Claude Code will now automatically track tool executions');
    console.log('📊 View analytics with: ccm stat --analyzer');
    
  } catch (error) {
    console.log('⚠️  Auto-setup failed:', error.message);
    console.log('💡 You can manually configure tracking with: ccm init');
  }
}

// Only run auto-setup if this is a global install or user explicitly wants it
const isGlobalInstall = process.env.npm_config_global === 'true';
const forceSetup = process.env.CCM_FORCE_SETUP === 'true';

if (isGlobalInstall || forceSetup) {
  setupAutoTracking();
} else {
  console.log('🔧 Claude Code Manager installed locally');
  console.log('💡 For automatic tracking setup, install globally: npm install -g claude-code-manager');
  console.log('🔧 Or run manually: npx ccm init');
}